
System.import("jQuery-Collapse").then(function($) {

	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.equal(typeof $.fn.collapse, "function", "Loaded jQuery-Collapse");

		QUnit.start();
		removeMyself();
	} else {
		console.log("jQuery-Collapse loaded", $);
	}

});
