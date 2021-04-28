var utils = require("../../ext/npm-utils");
var loader = require("@loader");

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

QUnit.test("utils.pkg.isRoot works when passed undefined as the pkg", function(assert){
	var isRoot = utils.pkg.isRoot;

	try {
		isRoot(loader, undefined);
		assert.ok(true, "did not throw");
	} catch(ex) {
		assert.notOk(true, "isRoot threw");
	}
});
