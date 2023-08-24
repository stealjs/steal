/**
 * Extension to warn users when a module is instantiated twice
 *
 * Multiple module instantiation might cause unexpected side effects
 */
addStealExtension(function addModuleLoadedWarn(loader) {
	let superInstantiate = loader.instantiate;

	let warn = typeof console === "object" ?
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
		let instantiated = loader._instantiatedModules;
		delete instantiated[load.address];
	};

	loader.instantiate = function(load) {
		let address = load.address;
		let loader = this;
		let instantiated = loader._instantiatedModules;

		if (warn && address && instantiated[address]) {
			let loads = (loader._traceData && loader._traceData.loads) || {};
			let map = (loader._traceData && loader._traceData.parentMap) || {};
			let instantiatedFromAddress = instantiated[load.address];

			// If we get here there might be a race condition from a failed linkset.
			if(instantiatedFromAddress.length === 1 &&
				instantiatedFromAddress[0] === load.name) {
				return superInstantiate.apply(loader, arguments);
			}

			let parentMods = instantiatedFromAddress.concat(load.name);
			let parents = parentMods
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
	let loaderDelete = loader["delete"];
	loader["delete"] = function(moduleName){
		let res = loaderDelete.apply(this, arguments);
		let load = this.getModuleLoad(moduleName);
		if(load) {
			this._instantiatedModules[load.address] = undefined;
		}
		return res;
	};
});
