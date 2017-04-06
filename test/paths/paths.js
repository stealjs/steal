steal("bar/foo/baz.js", function(foo){
	if(typeof window !== "undefined" && window.assert) {
		assert.equal(foo, "it works", "Loaded foo with weird path manipulation.");
		done();
	} else {
		console.log("basics loaded", module);
	}
});
