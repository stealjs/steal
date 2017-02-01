var QUnit = require("steal-qunit");

QUnit.module("steal.clone()");

QUnit.test("Configuration is not overridden when cloning", function(){
	steal.config({
		ext: {
			"foo": "bar"
		}
	});

	QUnit.equal(steal.config("ext").foo, "bar", "initial value is right");

	var clonedSteal = steal.clone();

	QUnit.equal(steal.config("ext").foo, "bar", "value is preserved");
});

QUnit.test("The @steal module is included", function(){
	var clonedSteal = steal.clone();
	var localSteal = clonedSteal.loader.get("@steal");
	QUnit.ok(localSteal, "a local steal is included");
});

QUnit.test("Cloning the loader gives you @loader and @steal", function(){
	var loader = steal.loader;
	var clone = loader.clone();

	QUnit.ok(clone.get("@loader"), "The @loader module is included");
	QUnit.ok(clone.get("@steal"), "The @steal module is included");
});

QUnit.test("A cloned steal's loader includes the @loader and @steal modules", function(){
	var cloned = steal.clone();

	QUnit.equal(cloned.loader.get("@loader")["default"], cloned.loader);
	QUnit.equal(cloned.loader.get("@steal")["default"], cloned);
});

QUnit.test("A cloned steal includes the .clone function", function(){
	QUnit.ok(steal.clone().clone, "The .clone function exists");
});
