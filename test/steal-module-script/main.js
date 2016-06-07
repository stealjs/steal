if (typeof window !== "undefined" && window.QUnit) {
	QUnit.ok(true, "main js loaded");
	QUnit.equal(typeof window.MODULE, "undefined", "main.js is loaded first");
	QUnit.start();
	removeMyself();
} else {
	console.log("Main loaded");
}
