import module from "other";

if(typeof window !== "undefined" && window.assert) {
	assert.ok(module, "got basics/module");
	assert.equal(module, "bar", "module name is right");
	done();
} else {
	console.log("basics loaded", module);
}
