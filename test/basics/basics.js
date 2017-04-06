steal('basics/module', function(module) {
	var isNode = typeof process === "object" && {}.toString.call(process) === "[object process]";

	if(typeof window !== "undefined" && window.assert) {
		assert.ok(module, "got basics/module");
		assert.equal(module.name, "module", "module name is right");
		assert.equal(module.es6module.name, "es6Module", "steal loads ES6");
		assert.equal(module.es6module.amdModule.name, "amdmodule", "ES6 loads amd");
		done();
	} else {
		if(typeof console === "object") {
			console.log("basics loaded", module.name, module.es6module.name, module.es6module.amdModule.name);
		}

		if(!isNode) {
			var host = document.createElement("div");
			var one = document.createElement("div");
			var two = document.createElement("div");
			var three = document.createElement("div");

			one.textContent = module.name;
			two.textContent = module.es6module.name;
			three.textContent = module.es6module.amdModule.name;

			[one, two, three].forEach(function(div){
				host.appendChild(div);
			});
			document.body.appendChild(host);
		}
	}
});
