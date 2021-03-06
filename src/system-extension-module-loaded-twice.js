/**
 * Extension to warn users when a module is instantiated twice
 *
 * Multiple module instantiation might cause unexpected side effects
 */
addStealExtension(function addModuleLoadedWarn(loader) {
	var superInstantiate = loader.instantiate;

	var warn = typeof console === "object" ?
	Function.prototype.bind.call(console.warn, console) :
	null;

	if(!loader._instantiatedModules) {
		Object.defineProperty(loader, '_instantiatedModules', {
			value: Object.create(null),
			writable: false
		});
	}

	// When loads are part of a failed linkset they have been instantiated
	// but might be re-instantiated if part of another linkset.
	loader._pendingState = function(load){
		var instantiated = loader._instantiatedModules;
		delete instantiated[load.address];
	};

	loader.instantiate = function(load) {
		var address = load.address;
		var loader = this;
		var instantiated = loader._instantiatedModules;

		if (warn && address && instantiated[address]) {
			var loads = (loader._traceData && loader._traceData.loads) || {};
			var map = (loader._traceData && loader._traceData.parentMap) || {};
			var instantiatedFromAddress = instantiated[load.address];

			// If we get here there might be a race condition from a failed linkset.
			if(instantiatedFromAddress.length === 1 &&
				instantiatedFromAddress[0] === load.name) {
				return superInstantiate.apply(loader, arguments);
			}

			var parentMods = instantiatedFromAddress.concat(load.name);
			var parents = parentMods
				.map(function(moduleName){
					return "\t" + moduleName + "\n" +

					(map[moduleName] ? Object.keys(map[moduleName]) : [])
					.map(function(parent) {
						// module names might confuse people
						return "\t\t - " + loads[parent].address;
					})
					.join("\n");
				})
				.join("\n\n");

			warn([
				"The module with address " + load.address +
					" is being instantiated twice.",
				"This happens when module identifiers normalize to different module names.\n",
				"Modules:\n" + (parents || "") + "\n",
				"HINT: Import the module using the ~/[modulePath] identifier.\n" +
				"Learn more at https://stealjs.com/docs/moduleName.html and " +
					"https://stealjs.com/docs/tilde.html"
			].join("\n"));
		} else if(loader._configLoaded && address) {
			instantiated[load.address] = [load.name];
		}

		return superInstantiate.apply(loader, arguments);
	};

	// When a module is deleted, remove its _instantiatedModules record as well.
	var loaderDelete = loader["delete"];
	loader["delete"] = function(moduleName){
		var res = loaderDelete.apply(this, arguments);
		var load = this.getModuleLoad(moduleName);
		if(load) {
			this._instantiatedModules[load.address] = undefined;
		}
		return res;
	};
});
