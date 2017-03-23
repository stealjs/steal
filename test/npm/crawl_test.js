var crawl = require("../../ext/npm-crawl");
var helpers = require("./helpers")(System);
var utils = require("../../ext/npm-utils");

var FetchTask = crawl.FetchTask;

QUnit.module("npm-crawl/getDependencyMap");

QUnit.test("Returns the correct dependencies for " +
		   "a package with peer deps", function(assert){

	var pkg = {
	 "name": "angular2",
	 "version": "2.0.0-beta.12",
	 "fileUrl": "./node_modules/angular2/package.json",
	 "peerDependencies": {
	  "es6-shim": "^0.35.0",
	  "reflect-metadata": "0.1.2",
	  "rxjs": "5.0.0-beta.2",
	  "zone.js": "^0.6.6"
	 }
	};

	var map = crawl.getDependencyMap(System, pkg, false);

	assert.equal(map["rxjs"].name, "rxjs", "correctly mapped peer dep");
});

QUnit.module("npm-crawl/FetchTask");

QUnit.test("loads a package.json", function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "1.1.0",
			main: "main.js"
		}
	});

	var done = helpers.done(assert.async(), reset);

	var pkg = {
		name: "app",
		version: "^1.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var task = new FetchTask(helpers.makeContext(), pkg)
	task.load()
	.then(function(){
		var pkg = task.getPackage();
		assert.equal(utils.pkg.main(pkg), "main");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Fetching while fileUrl is currently loading (first fails - error)", function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "1.0.0",
			main: "main.js"
		}
	});

	var done = helpers.done(assert.async(), reset);

	var pkgOne = {
		name: "app",
		version: "1.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var pkgTwo = {
		name: "app",
		version: "2.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var context = helpers.makeContext();

	var taskOne = new FetchTask(context, pkgOne);
	taskOne.load();

	var taskTwo = new FetchTask(context, pkgTwo);

	taskTwo.fetch = function() {
		assert.ok(false, "Fetch should not be called, fileUrl is currently loading");
	};

	taskTwo.load()
	.then(function(){
		assert.ok(taskTwo.failed, "It failed");
		assert.ok(taskTwo.error, "Got an error");
		assert.ok(/Incompatible package version/.test(taskTwo.error));
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Fetching while fileUrl is currently loading (first fails - semver incompat, but compat with second)", function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "2.0.0",
			main: "main.js"
		}
	});

	var done = helpers.done(assert.async(), reset);

	var pkgOne = {
		name: "app",
		version: "1.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var pkgTwo = {
		name: "app",
		version: "2.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var context = helpers.makeContext();

	var taskOne = new FetchTask(context, pkgOne);
	taskOne.load();

	var taskTwo = new FetchTask(context, pkgTwo);
	taskTwo.load()
	.then(function(){
		assert.ok(!taskTwo.failed, "It succeeded");

		var pkg = taskTwo.getPackage();
		assert.equal(pkg.version, "2.0.0");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Fetching while fileUrl is currently loading (first fails - semver incompat, incompat with second)", function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "3.0.0",
			main: "main.js"
		}
	});

	var done = helpers.done(assert.async(), reset);

	var pkgOne = {
		name: "app",
		version: "1.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var pkgTwo = {
		name: "app",
		version: "2.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var context = helpers.makeContext();

	var taskOne = new FetchTask(context, pkgOne);
	taskOne.load();

	var taskTwo = new FetchTask(context, pkgTwo);
	taskTwo.load()
	.then(function(){
		assert.ok(taskTwo.failed, "It failed");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("First load fails and the load for the nextFileUrl is loading",
		   function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "1.1.0",
			main: "main.js"
		}
	});
	var done = helpers.done(assert.async(), reset);

	var pkgOne = {
		name: "app",
		version: "^1.0.0",
		origFileUrl: "./node_modules/foo/node_modules/app/package.json"
	};

	var pkgTwo = {
		name: "app",
		version: "^1.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var context = helpers.makeContext();

	var task = new FetchTask(context, pkgOne);
	task.load()
	.then(function(){
		assert.equal(task.failed, true, "The first task failed");

		// Start a new task for the real location.
		new FetchTask(context, pkgTwo).load();

		// Now create a new task for the next location and try to load it.
		var nextPkg = task.next();
		task = new FetchTask(context, nextPkg);
		return task.load();
	})
	.then(function(){
		assert.equal(task.failed, false, "Task did not fail again");

		var pkg = task.getPackage();
		assert.equal(pkg.version, "1.1.0", "Loaded the correct version");
		assert.ok(!context.loadingPaths[task.pkg.fileUrl], "Task is removed " +
				  "from the context");
	})
	.then(done, done);
});

QUnit.test("First load fails and the load for the nextFileUrl is complete and semver compatible",
		   function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "1.1.0",
			main: "main.js"
		}
	});
	var done = helpers.done(assert.async(), reset);

	var pkgOne = {
		name: "app",
		version: "^1.0.0",
		origFileUrl: "./node_modules/foo/node_modules/app/package.json"
	};

	var pkgTwo = {
		name: "app",
		version: "^1.0.0",
		origFileUrl: "./node_modules/app/package.json"
	};

	var context = helpers.makeContext();

	var task = new FetchTask(context, pkgOne);
	task.load()
	.then(function(){
		assert.equal(task.failed, true, "The first task failed");

		// Start a new task for the real location.
		// Wait for it to finish so that the retry below will
		// find a loaded version ready to go.
		return new FetchTask(context, pkgTwo).load()
		.then(function(){
			// Now create a new task for the next location and try to load it.
			var nextPkg = task.next();
			task = new FetchTask(context, nextPkg);
			return task.load();
		});
	})
	.then(function(){
		assert.equal(task.failed, false, "Task did not fail again");

		var pkg = task.getPackage();
		assert.equal(pkg.version, "1.1.0", "Loaded the correct version");
	})
	.then(done, done);
});

QUnit.test("First load fails and the load for the nextFileUrl is complete and not semver compatible",
		   function(assert){
	var reset = helpers.hookFetch({
		"./node_modules/app/package.json": {
			name: "app",
			version: "1.1.0",
			main: "main.js"
		},
		"./node_modules/foo/node_modules/app/package.json": {
			name: "app",
			version: "2.0.0",
			main: "main.js"
		}
	});
	var done = helpers.done(assert.async(), reset);

	var pkgOne = {
		name: "app",
		version: "^1.0.0",
		origFileUrl: "./node_modules/foo/node_modules/bar/node_modules/app/package.json"
	};

	var pkgTwo = {
		name: "app",
		version: "^2.0.0",
		origFileUrl: "./node_modules/foo/node_modules/app/package.json"
	};

	var context = helpers.makeContext();

	var task = new FetchTask(context, pkgOne);
	task.load()
	.then(function(){
		assert.equal(task.failed, true, "The first task failed");

		// Start a new task for the real location.
		// Wait for it to finish so that the retry below will
		// find a loaded version that is semver incompatible
		return new FetchTask(context, pkgTwo).load()
		.then(function(){
			// Now create a new task for the next location and try to load it.
			var nextPkg = task.next();
			task = new FetchTask(context, nextPkg);
			return task.load();
		});
	})
	.then(function(){
		assert.equal(task.failed, true, "Task failed again, an incompatible version");

		var nextPkg = task.next();
		task = new FetchTask(context, nextPkg);
		return task.load();
	})
	.then(function(){
		assert.equal(task.failed, false, "Task did not fail again");

		var pkg = task.getPackage();
		assert.equal(pkg.version, "1.1.0", "Loaded the correct version");
	})
	.then(done, done);

});
