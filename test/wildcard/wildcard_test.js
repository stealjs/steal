var steal = require("@steal");
var QUnit = require("steal-qunit");

QUnit.module("steal.isMatch");

QUnit.test("can match file extension", function(assert){
	var matched = steal.isMatch("http://foo.com/foo.js", "*.js");
	assert.equal(matched, true, "Is a match");
});

QUnit.test("can match folder globs", function(assert){
	var matched = steal.isMatch("http://foo.com/folder/foo.js", "**/folder/*.js");
	assert.equal(matched, true, "Is a match");
});

QUnit.test("Doesn't match folder globs for different file extensions", function(assert){
	var matched = steal.isMatch("http://foo.com/folder/foo.css", "**/folder/*.js");
	assert.equal(matched, false, "Did not match");
});
