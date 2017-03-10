
steal.done().then(function() {
	if (window.QUnit) {
		QUnit.equal(steal.config("bar"), "bar",
			"should get options from last script tag");

		QUnit.start();
		removeMyself();
	}
	else {
		console.log("config bar: ", steal.config("bar"));
	}
});
