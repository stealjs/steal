/**
 * Extension to warn users when a module is instantiated twice
 *
 * Multiple module instantiation might cause unexpected side effects
 */
addStealExtension(function(loader) {
	var superInstantiate = loader.instantiate;

	var warn = typeof console === "object" ?
		Function.prototype.bind.call(console.warn, console) :
		null;

	loader._instantiatedModules = loader._instantiatedModules || {};

	loader.instantiate = function(load) {
		var instantiated = loader._instantiatedModules;

		if (warn && instantiated[load.address]) {
			var loads = (loader._traceData && loader._traceData.loads) || {};
			var map = (loader._traceData && loader._traceData.parentMap) || {};

			var parents = (map[load.name] ? Object.keys(map[load.name]) : [])
				.map(function(parent) {
					// module names might confuse people
					return "\t " + loads[parent].address;
				})
				.join("\n");

			warn(
				[
					"The module with address " + load.address +
						" is being instantiated twice",
					"This happens when module identifiers normalize to different module names.\n",
					"HINT: Import the module using the ~/[modulePath] identifier" +
						(parents ? " in " : ""),
					(parents || "") + "\n",
					"Learn more at https://stealjs.com/docs/moduleName.html and " +
						"https://stealjs.com/docs/tilde.html"
				].join("\n")
			);
		} else {
			instantiated[load.address] = load;
		}

		return superInstantiate.apply(loader, arguments);
	};
});

