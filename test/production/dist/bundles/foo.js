define("@config", ["@loader"], function(loader) {
loader.config({
	meta: {
		"jquerty": {
			exports: "jQuerty"
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
define("foo",["bar"], function(bar){
	if(typeof window !== "undefined" && window.assert) {
		assert.ok(bar, "got basics/module");
		assert.equal(bar.name, "bar", "module name is right");
		assert.equal(bar.jquerty.name, "jQuerty", "got global");
		done();
		return {};
	} else {
		console.log("basics loaded", bar);
	}
});



