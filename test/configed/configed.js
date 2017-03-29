steal(function() {
	if (typeof window !== "undefined" && window.assert) {
		assert.deepEqual(steal.config("bundle"),["foo"], "read back bundle");
		done();
	} else {
		console.log("basics loaded", module);
	}
});
