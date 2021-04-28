var loader = require("@loader");
var QUnit = require("steal-qunit");

QUnit.module("steal-env");

QUnit.test("getEnv", function(assert) {
	assert.equal(loader.getEnv(), "development", "Gets the right env");
});

QUnit.test("getPlatform", function(assert) {
	assert.equal(loader.getPlatform(), "window", "the window is the platform");
});

QUnit.test("isEnv", function(assert) {
	assert.ok(loader.isEnv("development"), "isEnv does work");
});

QUnit.test("isPlatform", function(assert) {
	assert.ok(loader.isPlatform("window"), "isPlatform works");
});
