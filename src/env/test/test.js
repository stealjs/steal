var loader = require("@loader");
var QUnit = require("steal-qunit");

QUnit.module("steal-env");

QUnit.test("getEnv", function(){
	QUnit.equal(loader.getEnv(), "development", "Gets the right env");
});

QUnit.test("getPlatform", function(){
	QUnit.equal(loader.getPlatform(), "window", "the window is the platform");
});

QUnit.test("isEnv", function(){
	QUnit.ok(loader.isEnv("development"), "isEnv does work");
});

QUnit.test("isPlatform", function(){
	QUnit.ok(loader.isPlatform("window"), "isPlatform works");
});