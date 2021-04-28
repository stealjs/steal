"format es6";

if (window.assert) {
	assert.ok(steal.isEnv("test"), "steal env should be 'test'");
	assert.equal(window.foo, "default", "should load babel plugin");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
