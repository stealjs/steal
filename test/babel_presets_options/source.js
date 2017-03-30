"format es6";

if (window.assert) {
	assert.equal(window.foo, "bar", "preset should take options");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
