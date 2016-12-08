steal('basics/module', function(module){

	var isNode = typeof process === "object" && {}.toString.call(process) === "[object process]";

	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.ok(module, "got basics/module");
		QUnit.equal(module.name, "module", "module name is right");

		QUnit.equal(module.es6module.name, "es6Module", "steal loads ES6");

		QUnit.equal(module.es6module.amdModule.name, "amdmodule", "ES6 loads amd");

		QUnit.start();
		removeMyself();
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
