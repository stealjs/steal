import secret from "./secret";

if (window.assert) {
	assert.equal(window.foo, "bar", "custom plugin should add `foo`");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
