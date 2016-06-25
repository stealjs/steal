var helpers = require("steal-test-helpers")(require("@loader"));
var QUnit = require("steal-qunit");

QUnit.module("scoped_meta extension");

QUnit.test("Associates metadata with every import in the chain", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "index.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#index", "require('./foo');")
		.withModule("app@1.0.0#foo", "require('./bar');")
		.withModule("app@1.0.0#bar", "module.exports='wha';")
		.loader;

	loader.addScopedMeta("app@1.0.0#foo", "app@1.0.0#index", "foo", "bar");

	loader.import("app")
	.then(function(){
		var fooMeta = loader.getModuleLoad("app@1.0.0#foo").metadata;
		assert.equal(fooMeta.foo, "bar");

		var barMeta = loader.getModuleLoad("app@1.0.0#bar").metadata;
		assert.equal(barMeta.foo, "bar");
	})
	.then(done, function(err){
		console.error(err);
		done(err);
	});
});

QUnit.test("Works when there is a plugin", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "index.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#index", "require('./foo');")
		.withModule("app@1.0.0#foo", "require('./bar!plug');")
		.withModule("app@1.0.0#bar!plug", "module.exports = 'works';")
		.withModule("plug", "module.exports = 'this is a plugin';")
		.loader;

	loader.addScopedMeta("app@1.0.0#foo", "app@1.0.0#index", "foo", "bar");

	loader.import("app")
	.then(function(){
		var fooMeta = loader.getModuleLoad("app@1.0.0#foo").metadata;
		assert.equal(fooMeta.foo, "bar");

		var barMeta = loader.getModuleLoad("app@1.0.0#bar!plug").metadata;
		assert.equal(barMeta.foo, "bar");

		var plugMeta = loader.getModuleLoad("plug").metadata;
		assert.equal(plugMeta.foo, "bar");
	})
	.then(done, function(err){
		console.error(err);
		done(err);
	});

});
