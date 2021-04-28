var dep1 = require("dep1");

if(window.assert) {
	var dep2 = dep1.dep2;

	assert.equal(dep1.version, "1.0.0", "got dep1");
	assert.equal(dep2.version, "1.0.0", "got dep2");
	assert.equal(dep2.dep3, "1.0.0", "got dep3");
	done();
} else {
	console.log("dep1",dep1);
}
