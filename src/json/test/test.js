var QUnit = require("steal-qunit");

QUnit.module("JSON support");

QUnit.test("Basics works", function(assert){
	return steal.import("src/json/test/jsons/my.json")
		.then(function(my){
			assert.equal(my.name, "foo", "name is right");
		});
});

QUnit.test("Still resolves when we fail to parse", function(assert){
	return steal.import("src/json/test/jsons/bad.json")
		.then(function(){
			assert.ok(true);
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
