if(typeof window !== "undefined" && window.QUnit) {
	QUnit.ok(true, "got main module");
	QUnit.start();
	removeMyself();
} else {
	console.log("main loaded");
}