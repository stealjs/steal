var sum = require("./sum");

if (window != null && window.assert) {
	assert.equal(typeof sum, "function", "should get the default export");
	assert.equal(sum(2, 2), 4, "CJS/ESM interop works");
	done();
} else {
	console.log(sum);
}
