define([
	"@loader",
	"steal-test-helpers",
	"steal-qunit"
], function(System, stealTestHelpers, QUnit) {
	var helpers = stealTestHelpers(System);

	QUnit.module("plugins extension - normalize");

	QUnit.test("Can import and use npm packages", function(assert){
		var done = assert.async();

		var plugin = function(){
			var helper = require("helper");

			exports.normalize = function(normalize, name){
				return helper.addBar(name);
			};
		};

		var helper = function(){
			exports.addBar = function(name){
				return name + "-bar";
			};
		};

		var loader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"helper": "1.0.0"
				}
			})
			.withPackages([
				{
					name: "helper",
					main: "main.js",
					version: "1.0.0"
				}
			])
			.withModule("helper@1.0.0#main", helpers.toModule(helper))
			.withModule("app@1.0.0#plugin", helpers.toModule(plugin))
			.loader;

		loader.config({
			plugins: {
				"*": [
					"app/plugin"
				]
			}
		});

		loader.normalize("foo")
		.then(function(name){
			assert.equal(name, "foo-bar", "Extension was applied");
		}, function(err){
			assert.ok(!err, err.message || err);
		})
		.then(done, done);
	});

	QUnit.test("Can call the parent normalize", function(assert){
		var done = assert.async();

		var plugin = function(){
			var slice = Array.prototype.slice;
			exports.normalize = function(normalize, name){
				var args = slice.call(arguments, 1);
				return normalize.apply(this, args)
				.then(function(name){
					return name + "-hi";
				});
			};
		};

		var loader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0"
			})
			.withModule("app@1.0.0#plugin", helpers.toModule(plugin))
			.loader;

		loader.config({
			plugins: {
				"*": [
					"app/plugin"
				]
			}
		});

		loader.normalize("foo")
		.then(function(name){
			assert.equal(name, "foo-hi", "Extension was applied");
		}, function(err){
			assert.ok(!err, err.message || err);
		})
		.then(done, done);
	});

	QUnit.test("Uses the pluginLoader", function(assert){
		var done = assert.async();

		var one = function(){
			exports.normalize = function(normalize, name){
				return name + "-one";
			};
		};

		var two = function(){
			exports.normalize = function(normalize, name){
				return name + "-two";
			};
		};

		var loader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0"
			})
			.withModule("app@1.0.0#plugin", helpers.toModule(one))
			.withConfig({
				plugins: {
					"*": [
						"app/plugin"
					]
				}
			})
			.loader;

		var pluginLoader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0"
			})
			.withModule("app@1.0.0#plugin", helpers.toModule(two))
			.loader;

		loader.pluginLoader = pluginLoader;

		loader.normalize("foo")
		.then(function(name){
			assert.equal(name, "foo-two", "pluginLoader was used");
		}, function(err){
			assert.ok(!err, err.message || err);
		})
		.then(done, done);
	});


	QUnit.test("works with multiple plugins", function(assert){
		var done = assert.async();

		var one = function(){
			exports.normalize = function(normalize, name){
				return name + "-two";
			};
		};

		var two = function(){
			exports.normalize = function(normalize, name){
				return name + "-three";
			};
		};

		var loader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					one: "1.0.0",
					two: "1.0.0"
				}
			})
			.withPackages([
				{
					name: "one",
					main: "main.js",
					version: "1.0.0"
				},
				{
					name: "two",
					main: "main.js",
					version: "1.0.0"
				}
			])
			.withModule("one@1.0.0#main", helpers.toModule(one))
			.withModule("two@1.0.0#main", helpers.toModule(two))
			.withConfig({
				plugins: {
					"*": [
						"one",
						"two"
					]
				}
			})
			.loader;

		loader.normalize("zero")
		.then(function(name){
			assert.equal(name, "zero-two-three", "all plugins applied");
		}, function(err){
			assert.ok(!err, err.toString());
		})
		.then(done, done);

	});

	QUnit.module("extensions extension - locate");

	QUnit.test("Can locate modules", function(assert){
		var done = assert.async();

		var plugin = function(){
			exports.locate = function(locate, load){
				return "foo://" + load.name;
			};
		};

		var loader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0"
			})
			.withModule("app@1.0.0#plugin", helpers.toModule(plugin))
			.loader;

		loader.config({
			plugins: {
				"*": [
					"app/plugin"
				]
			}
		});

		loader.normalize("bar").then(function(name){
			return loader.locate({ name: name })
		})
		.then(function(address){
			assert.equal(address, "foo://bar", "Extension was applied");
		}, function(err){
			assert.ok(!err, err.message);
		})
		.then(done, done);
	});

	QUnit.module("extensions extension - translate");

	QUnit.module("extensions extension - instantiate");

	QUnit.test("A plugin to define dependencies", function(assert){
		var done = assert.async();

		var plugin = function(){
			exports.instantiate = function(instantiate, load){
				load.metadata.deps = ["global"];
			};
		};

		var globalModule = 'window.glob = function() { return "global"; };';
		var fooModule = "window.foo = glob();";

		var loader = helpers.clone()
			.rootPackage({
				name: "app",
				main: "main.js",
				version: "1.0.0"
			})
			.withModule("app@1.0.0#plugin", helpers.toModule(plugin))
			.withModule("foo", fooModule)
			.withModule("global", globalModule)
			.loader;

		loader.config({
			plugins: {
				"*.js": [
					"app/plugin"
				]
			}
		});

		loader.import("foo")
		.then(function(value){
			assert.equal(value, "global", "Extension was applied");
		}, function(err){
			assert.ok(!err, err);
		})
		.then(done, done);

	});

});
