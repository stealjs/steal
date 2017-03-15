import secret from "./secret";

if (window.QUnit) {
	QUnit.start();
	QUnit.equal(window.foo, "option value", "custom plugin should receive options");
	removeMyself();
}
else {
	console.log("window.foo: ", window.foo);
}
