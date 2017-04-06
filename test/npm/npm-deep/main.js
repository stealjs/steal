var name = require("some/mod/");

if (typeof window !== "undefined" && window.assert) {
	assert.equal(name, "mod", "got a npm module using the forward slash extension" );
	done();
} else if(typeof window !== "undefined") {
	console.log("module: ", name);
}
