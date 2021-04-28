if (window != null && window.assert) {
	steal.import("missing_less_plugin/main.less!")
		.then(function() {
			assert.ok(false, "import promise should not resolve");
			done();
		})
		.catch(function(error) {
			assert.ok(
				/steal-less plugin must be installed/.test(error.message),
				"throws with a descriptive error message"
			);
			done();
		});
}
