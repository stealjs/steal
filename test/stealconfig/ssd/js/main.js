steal(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.equal(steal.config("map")["mapd/mapd"], "map/mapped");
		QUnit.start();
		removeMyself();
	} else {
		console.log("map config", steal.config("map"));
	}
});
