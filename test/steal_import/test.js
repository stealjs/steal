var assert = require("assert");
var steal = require("../../main");

describe("steal.import() in Node", function(){
	it("Doesn't load a main if one is not provided", function(done){
		steal.config({
			config: __dirname + "/package.json!npm"
		});

		steal.import("other")
		.then(function(val){
			assert.equal(val, "it worked");
		})
		.then(done, done);
	});
});
