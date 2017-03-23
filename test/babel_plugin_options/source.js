"format es6";

if (window.assert) {
	assert.equal(window.foo, "option value", "plugin should receive options");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
