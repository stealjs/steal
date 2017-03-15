import secret from "./secret";

if (window.QUnit) {
	QUnit.start();
	QUnit.equal(window.foo, "default", "should load plugin from node_modules");
	removeMyself();
}
else {
	console.log("window.foo: ", window.foo);
}
