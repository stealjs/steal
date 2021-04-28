var dep1 = require("dep1");
var dep2 = require("dep2");

if(window.assert) {
	assert.equal(dep1.dep3, "1.0.0", "got version 1");
	assert.equal(dep1.dep4, "1.0.0", "got version 1");
	assert.equal(dep1.dep5, "1.0.0", "got version 1");
	assert.equal(dep2.dep3, "1.0.0", "got version 1");
	done();
} else {
	console.log("dep1",dep1,"dep2",dep2);
}
