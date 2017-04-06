define("@config", ["@loader"], function(loader) {
loader.config({
	envs: {
		"window-production": {
			meta: {
				"jquerty": {
					exports: "jQuerty"
				}
			}
		}
	}
});
});
System.define("jquerty","window.jQuerty = {name: 'jQuerty'}")
define("bar", ["jquerty"],function(jquerty){
	return {
		name: "bar",
		jquerty: jquerty
	};
});
define("foo",["bar", "@loader"], function(bar, loader){
	if(typeof window !== "undefined" && window.assert) {
		assert.ok(bar, "got basics/module");
		assert.equal(bar.name, "bar", "module name is right");
		assert.equal(bar.jquerty.name, "jQuerty", "got global");

		// envs
		assert.equal(loader.isEnv("production"), true, "This is production");
		assert.equal(loader.isPlatform("window"), true, "This is the window");
		done();
		return {};
	} else {
		console.log("basics loaded", bar);
	}
});
