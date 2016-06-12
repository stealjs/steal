if(typeof window !== "undefined" && window.QUnit) {
	QUnit.ok(true, "got main module");
	QUnit.equal(System.foo, "bar", "script options is set, steal got UrlOptions");
	QUnit.start();
	removeMyself();
} else {
	console.log("main loaded");
}