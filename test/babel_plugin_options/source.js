import secret from "./secret";

if (window.assert) {
	assert.equal(window.foo, "option value", "custom plugin should receive options");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
