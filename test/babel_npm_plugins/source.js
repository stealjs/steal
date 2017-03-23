import secret from "./secret";

if (window.assert) {
	assert.equal(window.foo, "default", "should load plugin from node_modules");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
