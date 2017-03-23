var utils = require("../../ext/npm-utils");

QUnit.module("npm-utils");

QUnit.test("utils.moduleName.isConditional works", function(assert) {
	var isConditional = utils.moduleName.isConditional;

	assert.notOk(isConditional("foo@0.0.1#foo"), "not a valid condition");
	assert.ok(isConditional("foo/#{bar}"), "should detect simple interpolation");
	assert.ok(isConditional("foo/#{bar.baz}"), "should detect member expressions");
	assert.ok(isConditional("foo#?bar.isBaz"), "should detect boolean conditions");
});

QUnit.test("utils.moduleName.isNpm works", function(assert) {
	var isNpm = utils.moduleName.isNpm;

	assert.ok(isNpm("foo@0.0.1#foo"), "should detect valid npm package names");
	assert.notOk(isNpm("foo/#{bar}"), "not a valid npm package module name");
	assert.notOk(isNpm("foo/#{bar.baz}"), "not a valid npm package module name");
	assert.notOk(isNpm("foo#?bar.isBaz"), "not a valid npm package module name");
});
