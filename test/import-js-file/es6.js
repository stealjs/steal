import MySalute from "salute.js";

if(typeof window !== "undefined" && window.assert) {
	assert.ok(true, "got main");
	assert.equal(MySalute, "Hello", "got module");
	done();
} else {
	console.log("main loaded", MySalute + " World");
}
