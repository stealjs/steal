"format es6";

if (window.assert) {
	assert.equal(window.foo, "default", "babel plugin should add `window.foo`");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
