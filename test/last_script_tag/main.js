steal.done().then(function() {
	if (window.assert) {
		assert.equal(steal.config("bar"), "bar",
			"should get options from last script tag");
		done();
	}
	else {
		console.log("config bar: ", steal.config("bar"));
	}
});
