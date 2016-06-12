steal(function (module) {
	if (typeof window !== "undefined" && window.QUnit) {
		QUnit.equal(window.System.map["mapd/mapd"], "map/mapped");
		QUnit.start();
		removeMyself();
	} else {
		console.log("System.map", window.System.map);
	}
});