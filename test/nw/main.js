if(typeof window !== "undefined" && window.assert) {
	assert.ok(true, "Loaded the main in nwjs");
	done();
} else {
	console.log("Yay");
}
