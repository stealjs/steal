define([
	"@loader",
	"steal-test-helpers",
	"steal-qunit"
], function(System, stealTestHelpers, QUnit) {
	var helpers = stealTestHelpers(System);

	function toModule(fn){
		var source = fn.toString()
			.replace(/^function \(\).*{/, "");
		return source.substr(0, source.length - 1).trim();
	}

	QUnit.module("extensions extension - normalize");

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
			.withModule("helper@1.0.0#main", toModule(helper))
			.withModule("app@1.0.0#plugin", toModule(plugin))
			.loader;

		loader.config({
			extensions: [
				"app/plugin"
			]
		});

		loader._installModules = System._installModules;

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
			.withModule("app@1.0.0#plugin", toModule(plugin))
			.loader;

		loader.config({
			extensions: [
				"app/plugin"
			]
		});

		loader._installModules = System._installModules;

		loader.normalize("foo")
		.then(function(name){
			assert.equal(name, "foo-hi", "Extension was applied");
		}, function(err){
			assert.ok(!err, err.message || err);
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
			.withModule("app@1.0.0#plugin", toModule(plugin))
			.loader;

		loader.config({
			extensions: [
				"app/plugin"
			]
		});

		loader._installModules = System._installModules;

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
			.withModule("app@1.0.0#plugin", toModule(plugin))
			.withModule("foo", fooModule)
			.withModule("global", globalModule)
			.loader;

		loader.config({
			extensions: [
				"app/plugin"
			]
		});

		loader._installModules = System._installModules;

		loader.import("foo")
		.then(function(value){
			assert.equal(value, "global", "Extension was applied");
		}, function(err){
			assert.ok(!err, err);
		})
		.then(done, done);

	});

});
