
function configFirst(loader){
	// Override instantiate to ensure @config is loaded before `main`
	var loaderInstantiate = loader.instantiate;
	var deps = {
		"@config": true
	};
	loader.instantiate = function(load) {
		var loader = this;
		debugger;
		if(!loader.bundles[load.name] && !deps[load.name]) {
			return loader.import("@config").then(function() {
				loader.instantiate = loaderInstantiate;
				return loaderInstantiate.call(loader, load);
			});
		}

		if(deps[load.name]) {
			return loaderInstantiate.call(this, load).then(function(instantiateResult) {
				var depPromises = [];
				for(var i = 0, ideps = instantiateResult.deps,
					len = ideps.length; i < len; i++) {
					depPromises.push(loader.normalize(ideps[i], load.name, load.address));
				}
				return Promise.all(depPromises).then(function(ndeps){
					for(var i = 0, len = ndeps.length; i < len; i++) {
						deps[ndeps[i]] = true;
					}
					return instantiateResult;
				});
			});
		}
		
		return loaderInstantiate.call(this, load);
	};
}

if(typeof System !== "undefined") {
	configFirst(System);
}
