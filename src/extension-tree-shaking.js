addStealExtension(function (loader) {
	function determineUsedExports(load) {
		var loader = this;

		// 1. Get any new dependencies that haven't been accounted for.
		var newDeps = newDependants.call(this, load);
		var usedExports = new loader.Set();
		var allUsed = false;
		newDeps.forEach(function(depName) {
			var depLoad = loader.getModuleLoad(depName);
			var specifier = loader.moduleSpecifierFromName(depLoad, load.name);
			if(depLoad.metadata.format !== "es6") {
				allUsed = true;
				return;
			}

			var usedNames = depLoad.metadata.importNames[specifier] || [];
			usedNames.forEach(function(name){
				usedExports.add(name);
			});
		});

		// 2. Remove unused exports by traversing the AST
		load.metadata.usedExports = usedExports;
		load.metadata.allExportsUsed = allUsed;

		return {
			all: allUsed,
			used: usedExports
		};
	}

	// Determine if this load's dependants have changed,
	function newDependants(load) {
		var out = [];
		var deps = this.getDependants(load.name);
		var shakenParents = load.metadata.shakenParents;
		if(!shakenParents) {
			out = deps;
		} else {
			for(var i = 0; i < deps.length; i++) {
				if(shakenParents.indexOf(deps[i]) === -1) {
					out.push(deps[i]);
				}
			}
		}
		return out;
	}

	/**
	 * Look at a parent (dependant) module and get which exports it uses for a load.
	 */
	function getUsedExportsFromParent(load, parentName) {
		var parentLoad = this.getModuleLoad(parentName);
		var parentImportNames = parentLoad.metadata.importNames;
		if(parentImportNames) {
			var parentSpecifier = this.moduleSpecifierFromName(parentLoad, load.name);
			var usedNames = parentImportNames[parentSpecifier];
			return usedNames || [];
		}
		return [];
	}

	/**
	 * Determine if the new parent has resulted in new used export names
	 * If so, redefine this module so that it goes into the registry correctly.
	 */
	function reexecuteIfNecessary(load, parentName) {
		var usedExports = getUsedExportsFromParent.call(this, load, parentName);

		// Given the parent's used exports, loop over and see if any are not
		// within the usedExports set.
		var hasNewExports = false;
		for(var i = 0; i < usedExports.length; i++) {
			if(!load.metadata.usedExports.has(usedExports[i])) {
				hasNewExports = true;
			}
		}

		if(hasNewExports) {
			this["delete"](load.name);
			return loader.define(load.name, load.source, load);
		}

		return Promise.resolve();
	}

	// Wrap normalize to check if a module has already been tree-shaken
	// And if so, re-execute it if there are new dependant modules.
	var normalize = loader.normalize;
	loader.normalize = function(name, parentName) {
		var loader = this;
		var p = Promise.resolve(normalize.apply(this, arguments));

		return p.then(function(name) {
			var load = loader.getModuleLoad(name);

			// If this module is already marked as tree-shakable it means
			// it has been loaded before. Determine if it needs to be reexecuted.
			if(load && load.metadata.treeShakable) {
				return reexecuteIfNecessary.call(loader, load, parentName)
				.then(function(){
					return name;
				});
			}
			return name;
		});
	}

	// determineUsedExports is used with a Babel tree-shaking plugin.
	loader.determineUsedExports = determineUsedExports;
});
