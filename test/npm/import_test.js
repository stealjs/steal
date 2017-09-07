var helpers = require("./helpers")(System);
var utils = require("../../ext/npm-utils");

QUnit.module("Importing npm modules");

QUnit.test("package.json!npm produces correct fileUrl paths", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js"
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		var pkg = utils.pkg.getDefault(loader);
		assert.equal(pkg.fileUrl, "./package.json",
					 "correct default package.json");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("process.cwd()", function(assert){
	var done = assert.async();

	var appModule = "module.exports = process.cwd();";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#main", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(typeof app, "string", "process.cwd is a string");
		assert.equal(app[app.length - 1], "/", "ends in a slash");
	})
	.then(done, done);
});

QUnit.test("Allows a relative main", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "./relative.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#relative", "module.exports = 'worked'")
		.loader;

	loader["import"]("package.json!npm")
	.then(function(){
		return loader["import"](loader.main);
	})
	.then(function(app){
		assert.equal(app, "worked", "it loaded correctly");
	})
	.then(null,function(err) { console.log(err); })
	.then(done, done);
});

QUnit.test("Default npm algorithm", function (assert) {
	var done = assert.async();

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				"dep1": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep1",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"dep2": "1.0.0"
				}
			},
			{
				name: "dep2",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("dep1@1.0.0#main", "module.exports = require('dep2');")
		.withModule("dep2@1.0.0#main", "module.exports = 'loaded';")
		.withModule("app@1.0.0#main", "module.exports = require('dep1');");

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(val){
			assert.equal(runner.npmVersion(), 3, "we assume that the default npm version is higher or equal 3");
			assert.equal(val, "loaded", "dependencies loaded");
			assert.equal(loader.npmAlgorithm, "flat", "default npm algorithm is flat");
			assert.equal(loader.npmContext.isFlatFileStructure, true, "default isFlatFileStructure is 'true'")
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("Nested npm algorithm (< npm 3)", function (assert) {
	var done = assert.async();

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			system: {
				npmAlgorithm: "nested"
			},
			dependencies: {
				"dep1": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep1",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"dep2": "1.0.0"
				}
			},
			{
				name: "dep2",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("dep1@1.0.0#main", "module.exports = require('dep2');")
		.withModule("dep2@1.0.0#main", "module.exports = 'loaded';")
		.withModule("app@1.0.0#main", "module.exports = require('dep1');");

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(val){
			assert.equal(runner.isFlat(), false, "with npm algorithm=nested, npm have to be '2.15.5' or less");
			assert.equal(val, "loaded", "dependencies loaded");
			assert.equal(loader.npmAlgorithm, "nested", "npm algorithm is nested");
			assert.equal(loader.npmContext.isFlatFileStructure, false, "isFlatFileStructure is 'false'")
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("A project within a node_modules folder", function(assert){
	var done = assert.async();

	var main = "module.exports = require('dep');";
	var dep = "module.exports = 'works';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.withConfig({
			baseURL: "http://example.com/node_modules/project/something/else/"
		})
		.withModule("app@1.0.0#main", main)
		.withModule("dep@1.0.0#main", dep)
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader["import"](loader.main);
	})
	.then(function(val){
		assert.equal(val, "works", "able to load a project within a node_modules folder");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Previous packages are included in the package.json!npm source",
		   function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.loader;

	loader.npmContext = {
		pkgInfo: [
			{ name: "some-pkg", main: "main.js", version: "1.0.0", fileUrl: "" }
		]
	};

	helpers.init(loader)
	.then(function(){
		var load = loader.getModuleLoad("package.json!npm");
		var hasPkg = load.source.indexOf("some-pkg") !== -1;
		assert.ok(hasPkg, "the previous packages were applied to the source");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Configuration can be put on the 'steal' object in package.json",
	function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			steal: {
				foo: "bar"
			}
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		assert.equal(loader.foo, "bar", "using steal as config works");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Configuration can be put on the 'system' object in package.json",
	function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			system: {
				foo: "bar"
			}
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		assert.equal(loader.foo, "bar", "using steal as config works");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Works with modules that use process.argv", function(assert){
	var done = assert.async();
	var mainModule = "module.exports = process.argv.indexOf('foo') === -1";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js"
		})
		.withModule("app@1.0.0#main", mainModule)
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader["import"](loader.main);
	})
	.then(function(main){
		assert.equal(main, true, "it loaded");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("importing a package with a dependency not in its package.json", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"dep": "1.0.0",
				"dep2": "2.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				main: "main.js",
				version: "1.0.0"
			},
			{
				name: "dep2",
				main: "main.js",
				version: "2.0.0"
			}
		])
		.withModule("dep2@2.0.0#main", "module.exports={}")
		.withModule("dep@1.0.0#main", "require('dep2');")
		.loader;

		loader["import"]("dep")
			.then(function(app) {
				assert.ok(app);
			})
			.then(done, helpers.fail(assert, done));
});

QUnit.test("importing a global with an npm dependency", function(assert) {
	var done = assert.async();

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"dep": "1.0.0",
				"dep2": "2.0.0"
			},
			steal: {
				meta: {
					"dep": {
						format: "global",
						deps: ["dep2"]
					}
				}
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js"
			},
			{
				name: "dep2",
				version: "2.0.0",
				main: "main.js"
			}
		])
		.withModule("dep2@2.0.0#main", "window.$ = function() {};")
		.withModule("dep@1.0.0#main", "var foo = $('.foo');");

	var loader = runner.loader;

	function removeDollar() {
		delete window.$;
	}

	helpers.init(loader)
	.then(function(){
		return loader["import"]("dep");
	})
	.then(function(app) {
		assert.ok(app);
	})
	.then(function(){
		removeDollar();
		done();
	}, function(err){
		removeDollar();
		assert.ok(false, err.message && err.stack || err);
		done(err);
	});
});

QUnit.test("A child dependency's devDependency doesn't interfere with normal loading",
	function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main",
			dependencies: {
				dep: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main",
				devDependencies: {
					other: "1.0.0"
				}
			}
		])
		.withModule("app@1.0.0#main", "require('dep');")
		.withModule("dep@1.0.0#main", "module.exports='dep';")
		.withModule("other", "module.exports='works';")
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.import("app");
	})
	.then(function(){
		return loader.import("other");
	})
	.then(function(def){
		assert.equal(def, "works", "got the right module");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("importing a package with an unsaved dependency", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withPackages([
			{
				name: "dep",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

		loader["import"]("dep")
			.then(function(app) {
				assert.ok(false, "import call should not resolve");
			}, function(err) {
				assert.ok(/Could not load 'dep'/.test(err.message));
				assert.ok(
					/Is this an npm module not saved/.test(err.message),
					"should throw a descriptive error message"
				);
				done();
			});
});

QUnit.test("local named amd module that has deps", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#bar", "module.exports = 'bar';")
		.withModule(
			"app@1.0.0#foo",
			"def" + "ine('foo', ['./bar'], function(bar) { return bar; })"
		)
		.withModule("app@1.0.0#main", "require('./foo');")
		.loader;

	loader["import"]("app")
		.then(function(app) {
			assert.ok(app, "import promise should resolve");
		})
		.then(done, function(error) {
			assert.ok(!error, "import promise should not be rejected");
			done();
		});
});

QUnit.test("named amd module with deps from a nested dependency", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"dep": "2.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "2.0.0",
				main: "main.js",
				dependencies: {
					"foo": "1.0.0"
				}
			},
			{
				name: "foo",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("foo@1.0.0#bar", "module.exports = 'bar';")
		.withModule(
			"foo@1.0.0#main",
			"def" + "ine('foo', ['./bar'], function(bar) { return bar; })"
		)
		.withModule("dep@2.0.0#main", "require('foo');")
		.withModule("app@1.0.0#main", "require('dep');")
		.loader;

	loader["import"]("app")
		.then(function(app) {
			assert.ok(app, "import promise should resolve");
		})
		.then(done, function(error) {
			assert.ok(!error, "import promise should not be rejected");
			done();
		});
});

QUnit.module("Importing npm modules with tilde & homeAlias operators");

QUnit.test("Import module with the ~ operator", function (assert) {
	var done = assert.async();

	var app = "var foobar = require('~/foo/foobar');" +
						"var barfoo = require('~/./bar/barfoo');" +
						"module.exports = {" +
							"foobar: foobar," +
							"barfoo: barfoo" +
						"};";

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			system: {
				main: "main"
			}
		})
		.withModule("app@1.0.0#foo/foobar", "module.exports = 'module foobar';")
		.withModule("app@1.0.0#bar/barfoo", "module.exports = 'module barfoo';")
		.withModule("app@1.0.0#main", app);

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(app){
			assert.equal(app.foobar, "module foobar", "foobar module loaded");
			assert.equal(app.barfoo, "module barfoo", "barfoo module loaded");
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("Import module with the homeAlias operator", function (assert) {
	var done = assert.async();

	var app = "var foobar = require('@/foo/foobar');" +
						"var barfoo = require('@/./bar/barfoo');" +
						"module.exports = {" +
							"foobar: foobar," +
							"barfoo: barfoo" +
						"};";

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			system: {
				main: "main",
				homeAlias: "@"
			}
		})
		.withModule("app@1.0.0#foo/foobar", "module.exports = 'module foobar';")
		.withModule("app@1.0.0#bar/barfoo", "module.exports = 'module barfoo';")
		.withModule("app@1.0.0#main", app);

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(app){
			assert.equal(app.foobar, "module foobar", "foobar module loaded");
			assert.equal(app.barfoo, "module barfoo", "barfoo module loaded");
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("Import module with the ~ operator with directories.lib", function (assert) {
	var done = assert.async();

	var app = "var foobar = require('~/foo/foobar');" +
						"module.exports = {" +
						"foobar: foobar" +
						"};";

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			system: {
				main: "main",
				directories: {
					lib: "src"
				}
			}
		})
		.withModule("app@1.0.0#foo/foobar", "module.exports = 'module foobar';")
		.withModule("app@1.0.0#main", app);

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(app){
			assert.equal(app.foobar, "module foobar", "foobar module loaded");
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("Child packages with bundles don't have their bundles added",
	function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			system: {
				bundle: ["app-bundle"]
			},
			dependencies: {
				child: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "child",
				main: "main.js",
				version: "1.0.0",
				system: {
					bundle: ["child-bundle"]
				}
			}
		])
		.withModule("app@1.0.0#main", appModule)
		.loader;

	helpers.init(loader)
	.then(function(){
		var bundle = loader.bundle;
		assert.deepEqual(bundle, ["app-bundle"]);
	})
	.then(done, helpers.fail(assert, done));

});

QUnit.test("`transpiler` config in child pkg is ignored", function(assert){
	var done = assert.async();

	var appModule = "require('another');";
	var anotherModule = "require('deep');";
	var deepModule = "module.exports = {};";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				child: "1.0.0",
				another: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "child",
				main: "main.js",
				version: "1.0.0",
				system: {
					transpiler: "other"
				}
			},
			{
				name: "another",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					deep: "1.0.0"
				}
			},
			{
				name: "deep",
				main: "main.js",
				version: "1.0.0",
				system: {
					transpiler: "my-thing"
				}
			}
		])
		.withModule("app@1.0.0#main", appModule)
		.withModule("another@1.0.0#main", anotherModule)
		.withModule("deep@1.0.0#main", deepModule)
		.loader;

	var defaultTranspiler = loader.transpiler;

	helpers.init(loader)
	.then(function(){
		return loader["import"]("app");
	})
	.then(function(){
		assert.equal(loader.transpiler, defaultTranspiler, "Transpiler was not changed by child package config");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("'resolutions' config is preserved", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'worked';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"dep": "1.0.0"
			}
		})
		.withPackages([{
			name: "dep",
			main: "main.js",
			version: "1.0.0"
		}])
		.loader;

	loader.npmContext = {
		pkgInfo: [
			{name:"dep",main:"main.js",version:"1.0.0", fileUrl: "node_modules/dep/package.json",
			resolutions: {
				other: "1.0.0"
			}}
		]
	};
	loader.npmContext.pkgInfo["dep@1.0.0"] = true;

	helpers.init(loader)
	.then(function(){
		return loader.normalize("dep", "app@1.0.0#main");
	})
	.then(function(){
		let pkg = utils.filter(loader.npmContext.pkgInfo, function(pkg){
			return pkg.name === "dep" && pkg.version === "1.0.0";
		})[0];
		assert.equal(pkg.resolutions.other, "1.0.0");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("'resolutions' config is saved during the build for progressively loaded package.jsons", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "one",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				two: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "two",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					three: "1.0.0"
				}
			},
			{
				name: "three",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("one@1.0.0#main", "require('two');")
		.withModule("two@1.0.0#main", "require('three');")
		.withModule("three@1.0.0#main", "module.exports = 'it worked'")
		.loader;

	helpers.init(loader)
	.then(function(){
		loader.npmContext.resavePackageInfo = true;
		return loader["import"](loader.main);
	})
	.then(function(){
		var load = loader.getModuleLoad("package.json!npm");
		var source = load.source;

		assert.ok(/"three": "1.0.0"/.test(source), "it worked");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("'map' config is preserved", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"dep": "1.0.0"
			}
		})
		.withPackages([{
			name: "dep",
			main: "main.js",
			version: "1.0.0"
		}])
		.loader;

	loader.npmContext = {
		pkgInfo: [
			{name:"app",main:"main.js",version:"1.0.0", fileUrl: "package.json",
			steal: {
				map: {
					"dep/main": "dep/other"
				}
			}}
		]
	};
	loader.npmContext.pkgInfo["app@1.0.0"] = true;

	helpers.init(loader)
	.then(function(){
		//return loader.normalize("dep", "app@1.0.0#main");
	})
	.then(function(){
		let pkg = utils.filter(loader.npmContext.pkgInfo, function(pkg){
			return pkg.name === "app" && pkg.version === "1.0.0";
		})[0];
		assert.equal(pkg.steal.map["dep/main"], "dep/other");
	})
	.then(done, helpers.fail(assert, done));
});


QUnit.module("Importing npm modules using 'browser' config");

QUnit.test("Array property value", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browserify: {
				transform: [
					"loose-envify"
				]
			}
		})
		.withModule("app@1.0.0#main", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(app, "bar", "loaded the app");
	})
	.then(done, done);
});

QUnit.test("Specifies a different main", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browserify: "app.js"
		})
		.withModule("app@1.0.0#app", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(app, "bar", "loaded the app");
	})
	.then(done, done);
});

QUnit.module("Importing packages with /index convention");

QUnit.test("Retries with /index", function(assert){
	var done = assert.async();

	var appModule = "module.exports = { worked: true };";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#foo/index", appModule)
		.loader;

	loader["import"]("app/foo")
	.then(function(mod){
		assert.ok(mod.worked, "it loaded the index variant");
	})
	.then(done, done);
});

QUnit.test("Retries /package convention as well", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#package.json", "module.exports = 'works'")
		.loader;

	loader["import"]("./package", { name : "app@1.0.0#main" })
	.then(function(mod) {
		var pkgAddress = loader.getModuleLoad("app@1.0.0#package").metadata.address;

		assert.equal(mod, "works", "loaded the package.json");
		assert.ok(/\.json/.test(pkgAddress), "load.medatada.address has json");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't retry non-npm module names", function(assert){
	var done = assert.async();

	var appModule = "module.exports = { worked: true };";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("node_modules/foo/package.json/index", "module.exports={}")
		.loader;

	var retried = false;

	loader["import"]("node_modules/foo/package.json")
	.then(null, function(err){
		assert.ok(err, "Got an error, didn't retry");
	})
	.then(done, done);
});

QUnit.test("Retries when using the forward slash convention", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#lib/index", "module.exports = 'works'")
		.loader;

	loader["import"]("./lib/", { name: "app@1.0.0#main" })
	.then(function(mod){
		assert.equal(mod, "works", "imported the module");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't retry the forward slash convention in production", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#main", "module.exports = 'works'")
		.withModule("app@1.0.0#lib/index", "module.exports = 'works'")
		.loader;

	loader["import"]("app")
	.then(function(){
		delete loader.npmContext;

		return loader["import"]("./lib/", { name: "app@1.0.0#main" });
	})
	.then(null, function(err){
		assert.ok(err, "Got an error because we don't do retries in Prod");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't retry fetch fails for non-404s", function(assert){
	var done = assert.async();

	var plugSource = "exports.fetch = function(){return Promise.reject('It failed')}";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js"
		})
		.withModule("some-plug", plugSource)
		.allowFetch("app@1.0.0#foo!some-plug")
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader["import"]("app/foo!some-plug");
	})
	.then(null, function(err){
		assert.ok(/It failed/.test(err), "Failed for the right reason");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.module("Importing globalBrowser config");

QUnit.test("Builtins are ignored with builtins: false", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				steal: "1.0.0"
			},
			system: {
				builtins: false
			}
		})
		.withPackages([
			{
				name: "steal",
				version: "1.0.0",
				main: "steal.js",
				globalBrowser: {
					"http": "./http"
				}
			}
		])
		.withModule("steal@1.0.0#http", "module.exports = 'foo'")
		.withModule("http", "module.exports = 'bar'")
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader["import"]("http", { name: loader.main });
	})
	.then(function(src){
		assert.equal("bar", src, "imported right module");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("importing a module using the 'globals' option", function(assert) {
	var done = assert.async();

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"dep": "1.0.0"
			},
			system: {
				meta: {
					"app/main": {
						format: "global",
						globals: {
							"$$$": "dep"
						}
					}
				}
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("dep@1.0.0#main", "module.exports = {};")
		.withModule("app@1.0.0#main", "var foo = $$$;");

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(app) {
			assert.ok(app);
		})
		.then(done, function(err) {
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("package.json!npm throws if 'name' field is missing", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			version: "1.0.0",
			main: "main.js"
		})
		.loader;

	helpers.init(loader)
	.then(function() {
		assert.ok(false, "startup promise should not resolve");
		done();
	})
	.catch(function(err) {
		assert.ok(
			/Missing 'name' field in package.json file/.test(err.message),
			"should throw a nice error message"
		);
		done();
	});
});

QUnit.test("package.json!npm throws if 'version' field is missing", function(assert) {
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js"
		})
		.loader;

	helpers.init(loader)
	.then(function() {
		assert.ok(false, "startup promise should not resolve");
		done();
	})
	.catch(function(err) {
		assert.ok(
			/Missing 'version' field in package.json file/.test(err.message),
			"should throw a nice error message"
		);
		done();
	});
});
