var QUnit = require("steal-qunit");

QUnit.module("steal.clone()");

QUnit.test("Configuration is not overridden when cloning", function(assert) {
	steal.config({
		ext: {
			"foo": "bar"
		}
	});

	assert.equal(steal.config("ext").foo, "bar", "initial value is right");

	var clonedSteal = steal.clone();

	assert.equal(steal.config("ext").foo, "bar", "value is preserved");
});

QUnit.test("The @steal module is included", function(assert) {
	var clonedSteal = steal.clone();
	var localSteal = clonedSteal.loader.get("@steal");
	assert.ok(localSteal, "a local steal is included");
});

QUnit.test("Cloning the loader gives you @loader and @steal", function(assert) {
	var loader = steal.loader;
	var clone = loader.clone();

	assert.ok(clone.get("@loader"), "The @loader module is included");
	assert.ok(clone.get("@steal"), "The @steal module is included");
});

QUnit.test("A cloned steal's loader includes the @loader and @steal modules", function(assert) {
	var cloned = steal.clone();

	assert.equal(cloned.loader.get("@loader")["default"], cloned.loader);
	assert.equal(cloned.loader.get("@steal")["default"], cloned);
});

QUnit.test("A cloned steal includes the .clone function", function(assert) {
	assert.ok(steal.clone().clone, "The .clone function exists");
});
