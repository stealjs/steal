
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
