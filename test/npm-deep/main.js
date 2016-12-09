var name = require("some/mod/");

if (typeof window !== "undefined" && window.QUnit) {
	QUnit.equal(name, "mod", "got a npm module using the forward slash extension" );

	QUnit.start();
	removeMyself();
} else if(typeof window !== "undefined") {
	console.log("module: ", name);
}
