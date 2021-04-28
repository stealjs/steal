steal(function (module) {
	if (typeof window !== "undefined" && window.assert) {
		assert.equal(steal.config("map")["mapd/mapd"], "map/mapped");
		done();
	} else {
		console.log("map config", steal.config("map"));
	}
});
