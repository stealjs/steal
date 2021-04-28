"format es6";

if (window.assert) {
	assert.ok(steal.isEnv("test"), "steal env should be 'test'");
	assert.equal(window.foo, "default", "should load preset");
	done();
}
else {
	console.log("window.foo: ", window.foo);
}
