var dep1 = require("dep1");
var dep2 = require("dep2");

function hasQUnit() {
	return typeof window.assert !== "undefined";
}

if(hasQUnit()) {
	assert.equal(dep1, "1.0.0");
	assert.equal(dep2, "1.0.0");
	done();
} else {
	console.log(dep1, dep2);
}
