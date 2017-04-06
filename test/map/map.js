steal("mapd", function(m){
	if(window.assert) {
		assert.ok(m, "got map");
		assert.equal(m.name, "map", "module name is right");
		done();
	} else {
		console.log("basics loaded", m);
	}
});
