var dep1 = require("dep1");
var dep2 = require("dep2");

function hasQUnit() {
	return typeof QUnit !== "undefined";
}

if(hasQUnit()) {
	QUnit.equal(dep1, "1.0.0");
	QUnit.equal(dep2, "1.0.0");
	removeMyself();
} else {
	console.log(dep1, dep2);
}
