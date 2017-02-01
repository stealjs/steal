var QUnit = require("steal-qunit");

QUnit.module("JSON support");

QUnit.asyncTest("Basics works", function(assert){
	steal.import("src/json/test/jsons/my.json").then(function(my){
		assert.equal(my.name, "foo", "name is right");
	}).then(start);
});

QUnit.asyncTest("Still resolves when we fail to parse", function(assert){
	steal.import("src/json/test/jsons/bad.json").then(function(){
		assert.ok(true);
	}).then(start);
});

QUnit.asyncTest("jsonOptions transform allows you to transform the json object", function(assert){
	System.jsonOptions = {
		transform: function(load, data){
			delete data.priv;
			return data;
		}
	};

	steal.import("src/json/test/jsons/another.json").then(function(a){
		assert.ok(!a.priv, "Private field excluded");
	}).then(start);
});
