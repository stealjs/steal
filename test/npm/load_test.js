var helpers = require("./helpers")(System);
var utils = require("../../ext/npm-utils");

QUnit.module("package.json load object");

QUnit.test("System.main contains the package name without directories.lib",
		   function(assert){
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
		assert.equal(loader.main, "app@1.0.0#main", "correctly normalized");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("System.main contains the package name with directories.lib",
		   function(assert){
	var done = assert.async();
	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			system: {
				directories: {
					lib: "src"
				}
			}
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		assert.equal(loader.main, "app@1.0.0#main", "correctly normalized");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Configuration is reapplied after a live-reload", function(assert){
	var done = assert.async();

	var root = {
		name: "app",
		version: "1.0.0",
		main: "main.js",
		steal: {
			configDependencies: ["live-reload"],
			foo: "baz"
		}
	};

	var runner = helpers.clone()
		.rootPackage(root)
		.allowFetch("live-reload");

	var loader = runner.loader;
	loader.paths["live-reload"] = "ext/live-reload.js";

	helpers.init(loader)
	.then(function(){
		root.steal.foo = "bar";

		var liveReload = loader.get("live-reload").default;
		return liveReload("package.json!npm");
	})
	.then(function(){
		assert.equal(loader.foo, "bar", "config applied after a live-reload");
	})
	.then(done, helpers.fail(assert, done));
});
