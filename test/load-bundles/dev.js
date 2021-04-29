
module.exports = {};

if(typeof window !== "undefined" && window.assert) {
	assert.ok(true, "Dev loaded fine");
	done();
} else {
	console.log("works!");
}
