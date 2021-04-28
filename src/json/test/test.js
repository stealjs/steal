var QUnit = require("steal-qunit");
var helpers = require("test/helpers");

QUnit.module("JSON support");

QUnit.test("Basics works", function(assert){
	return steal.import("src/json/test/jsons/my.json")
		.then(function(my){
			assert.equal(my.name, "foo", "name is right");
		});
});

QUnit.test("jsonOptions transform allows you to transform the json object", function(assert){
	System.jsonOptions = {
		transform: function(load, data){
			delete data.priv;
			return data;
		}
	};

	return steal.import("src/json/test/jsons/another.json")
		.then(function(a){
			assert.ok(!a.priv, "Private field excluded");
		});
});

QUnit.test("json extension should not parse css files", function(assert) {
	var done = assert.async();

	steal.import("src/json/test/css-attr-selector.css!src/json/test/css")
		.then(function() {
			assert.ok(false, "steal.import should not resolve without css plugin");
			done();
		})
		.catch(function(err) {
			assert.ok(err, "without css plugin, css files are evaluated as js files");
			done();
		});
});

QUnit.test("Does warn when a JSON module cannot parse", function(assert) {
	var done = assert.async();
	var teardown = helpers.willWarn(/Error parsing/);

	steal.import("src/json/test/jsons/empty.json").then(function(){
		assert.equal(teardown(), 1, "one warning for bad json");
	}, function(err) {
		assert.ok(/Unable to parse/.test(err.message), "Firefox reject with a better error message");
	})
	.then(done);
});

QUnit.test("In production, json can be loaded from bundle without warnings", function(assert) {
	var done = assert.async();
	var teardown = helpers.willWarn(/Error parsing/);

	steal.loader.paths["bundle-a"] = "src/json/test/bundles/bundle-a.js";
	steal.loader.paths["bundle-b"] = "src/json/test/bundles/bundle-b.js";
	steal.loader.bundles["bundle-a"] = ["form-fields"];
	steal.import("form-fields").then(function(){
		assert.equal(teardown(), 0, "no warnings");
		done();
	})
});
