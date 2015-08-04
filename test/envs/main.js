define(['mod'], function(module){

	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.ok(module, "got envs/mod");
		QUnit.equal(module.name, "module", "module name is right");

		QUnit.start();
		removeMyself();
	} else {
		console.log("envs loaded", module);
	}

});
