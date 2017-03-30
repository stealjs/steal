"format es6";

if (window.assert) {
	assert.equal(window.foo, "default", "should load preset");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
