QUnit.module("JSON support");

asyncTest("Basics works", function(){
	System.import("src/json/tests/my.json").then(function(my){
		equal(my.name, "foo", "name is right");
	}).then(start);
});

asyncTest("Still resolves when we fail to parse", function(){
	System.import("src/json/tests/bad.json").then(function(){
		ok(true);
	}).then(start);
});

asyncTest("jsonOptions transform allows you to transform the json object", function(){
	System.jsonOptions = {
		transform: function(load, data){
			delete data.priv;
			return data;
		}
	};

	System.import("src/json/tests/another.json").then(function(a){
		ok(!a.priv, "Private field excluded");
	}).then(start);
});
