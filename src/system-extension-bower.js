
var bowerConfiged = function(loader){
	// Cached reference of each dependency's own bower.json
	var depBowers = {};

	// Utility function to fetch a bower.json file
	var getBowerJSON = function(address){
		return loader.fetch({
			address: address,
			metadata: {}
		}).then(function(bowerJson){
			return JSON.parse(bowerJson);
		});
  };

  var bowerOptionsPromise;
  var getBowerOptions = function(){
		if(!bowerOptionsPromise) {
      var config, deps;
			var bower = loader.bower;
			var baseURL = loader.baseURL;
			if(typeof bower === "boolean") {
				deps = loader.normalize("bower_components", baseURL);
				config = loader.normalize("bower.json", baseURL);
			} else if(typeof bower === "string") {
				deps = loader.normalize(bower, baseURL);
				config = loader.normalize("bower.json", baseURL);
			} else {
				deps = bower.dependencies;
				config = bower.config;
			}

			// Create a promise to retrieve the root bower.json
			bowerOptionsPromise = Promise.all([
				Promise.resolve(deps),
				Promise.resolve(config)
			]).then(function(res){
				return getBowerJSON(res[1]).then(function(data){
					return {
						rootBower: data,
						bowerPath: res[0]
					};
				});
			});
		}

		return bowerOptionsPromise;
	};

	var loaderConfig = loader.config;
	loader.config = function(cfg){
		// Disable when in production mode
		if(cfg.env === "production") {
			loader.locate = loaderLocate;
		} else if(cfg.stealPath && /bower_components/.test(cfg.stealPath) &&
						 loader.bower !== false) {
			// Turn on bower extension.
			loader.bower = true;
		}

		return loaderConfig.apply(this, arguments);
	};

	// overwrite locate to load module's bower and get the real address
	var loaderLocate = loader.locate;
	loader.locate = function(load){
		var promise = Promise.resolve(loaderLocate.call(this, load));

		return promise.then(function(proposedAddress){
			if(loader.bower) {
				// If the user has set a path, do not override that.
				if(loader.paths[load.name]) {
					return proposedAddress;
				}

				return getBowerOptions().then(function(options){
					var bower = options.rootBower;
					var bowerPath = options.bowerPath;
					var deps = bower.dependencies;

					if(deps[load.name]) {
						var depBowerPath = bowerPath + "/" + load.name + "/";
						depBowers[load.name] = depBowers[load.name] ||
							getBowerJSON(depBowerPath + "bower.json");

						// Cache a copy of this dependency's own `bower.json` so that we can
						// look at it's contents in the future without fetching a new copy.
						return depBowers[load.name].then(function(depBower) {
							var bowerDeps = [];
							if(depBower.dependencies) {
								for(var d in depBower.dependencies) {
									bowerDeps.push(d);
									deps[d] = true;
								}
								load.metadata.bowerDeps = bowerDeps.length ? bowerDeps : undefined;
							}

							// Some invalid `bower.json` files do not contain a main. If so
							// we have to bail on the attempt to automatically load this
							// dependency.
							var main = depBower.main;
							if(main) {
							  return depBowerPath + main;
							}

							return proposedAddress;
						});

					}

					return proposedAddress;
				});

			}

			return proposedAddress;
		});
	};

	var loaderInstantiate = loader.instantiate;
	loader.instantiate = function(load){
		var basePromise = Promise.resolve(loaderInstantiate.call(this, load));
		return basePromise.then(function(instantiateResult){
			if(depBowers[load.name] && load.metadata.bowerDeps) {
				// Import all bower dependencies
				var deps = load.metadata.bowerDeps;
				var imports = [];
				for(var i = 0, len = deps.length; i < len; i++) {
					imports.push(loader.import(deps[i]));
				}
				return Promise.all(imports).then(function() {
					return instantiateResult;
				});
			}
			return instantiateResult;
		});
	};
};

if(typeof System !== "undefined") {
	bowerConfiged(System);
}
