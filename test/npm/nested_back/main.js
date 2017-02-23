var dep1 = require("dep1");

if(window.QUnit) {
	var dep2 = dep1.dep2;

	QUnit.equal(dep1.version, "1.0.0", "got dep1");
	QUnit.equal(dep2.version, "1.0.0", "got dep2");
	QUnit.equal(dep2.dep3, "1.0.0", "got dep3");
	removeMyself();
} else {
	console.log("dep1",dep1);
}
