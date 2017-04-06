var my = require("json/my.json");

if (typeof window !== "undefined" && window.assert) {
	assert.equal(my.foo, "bar", "module returned");
	done();
} else {
	console.log("my ", my);
}
