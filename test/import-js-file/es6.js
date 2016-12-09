import MySalute from "salute.js";

if(typeof window !== "undefined" && window.QUnit) {
	QUnit.ok(true, "got main");
	QUnit.equal(MySalute, "Hello", "got module");

	QUnit.start();
	removeMyself();
} else {
	console.log("main loaded", MySalute + " World");
}