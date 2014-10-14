
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
			var bowerPath, bowerConfigPath;
			var bower = loader.bower;
			var baseURL = loader.baseURL;
			if(typeof bower === "boolean") {
				bowerPath = loader.normalize("bower_components", baseURL);
				bowerConfigPath = loader.normalize("bower.json", baseURL);
			} else if(typeof bower === "string") {
				bowerPath = loader.normalize(bower, baseURL);
				bowerConfigPath = loader.normalize("bower.json", baseURL);
			} else {
				bowerPath = bower.dependencies;
				bowerConfigPath = bower.config;
			}

			// Create a promise to retrieve the root bower.json
			bowerOptionsPromise = Promise.all([
				Promise.resolve(bowerPath),
				Promise.resolve(bowerConfigPath)
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
	loader.config = function(options){
		// Disable when in production mode
		if(options.env === "production") {
			loader.locate = loaderLocate;
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
};

if(typeof System !== "undefined") {
	bowerConfiged(System);
}
