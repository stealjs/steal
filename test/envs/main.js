define(['@loader','mod'], function(loader,module){
	if(typeof window !== "undefined" && window.assert) {
		assert.ok(module, "got envs/mod");
		assert.equal(module.name, "module", "module name is right");
		assert.equal(loader.FOO, "bar", "config dep's env settings are not overwrite");
		assert.equal(loader.isEnv("staging"), true, "isEnv works");
		assert.equal(loader.isPlatform("window"), true, "Is a browser window");

		assert.equal(loader.map.mod, "other", "main config's map is applied");
		assert.equal(loader.map.something, "else", "dep config's map is applied");
		done();
	} else {
		console.log("envs loaded", module);
	}
});
