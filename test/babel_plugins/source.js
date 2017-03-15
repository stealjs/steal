import secret from "./secret";

if (window.QUnit) {
	QUnit.start();
	QUnit.equal(window.foo, "bar", "custom plugin should add `foo`");
	removeMyself();
}
else {
	console.log("window.foo: ", window.foo);
}
