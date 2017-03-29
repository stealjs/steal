if(typeof window !== "undefined" && window.assert) {
	assert.ok(true, "got main module");
	assert.equal(steal.config("foo"), "bar", "script options is set, steal got UrlOptions");
	done();
} else {
	console.log("main loaded");
}
