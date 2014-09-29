
var bowerConfiged = function(loader){
	var depMains = {};

  var bowerOptionsPromise;
  var getBowerOptions = function(){
		if(!bowerOptionsPromise) {
			var bowerPath, bowerConfigPath;
			var bower = loader.bower;
			if(typeof bower === "boolean") {
				var stealPath = loader.stealPath;
				if(stealPath) {
					bowerPath = stealPath;
					bowerConfigPath = steal.joinURIs(stealPath, "../bower.json");
				} else {
					bowerPath = steal.joinURIs(loader.baseURL, "bower_components/");
					bowerConfigPath = steal.joinURIs(bowerPath, "../bower.json");
				}
			} else if(typeof bower === "string") {
				bowerPath = steal.joinURIs(bower, "./bower_components/");
				bowerConfigPath = bower;
			} else {
				bowerPath = bower.path;
				bowerConfigPath = bower.config;
			}

			bowerOptionsPromise = loader.fetch({
				address.bowerConfigPath,
				metadata: {}
			}).then(function(bowerJson){
				return JSON.parse(bowerJson);
			});
		}

		return bowerOptionsPromise;
	};

	// overwrite locate to load module's bower and get the real address
	var oldLocate = loader.locate;
	loader.locate = function(load){
		var promise = Promise.resolve(oldLocate.call(this, load));

		return promise.then(function(proposedAddress){
			if(loader.bower) {
				// If the user has set a path, do not override that.
				if(loader.paths[load.name]) {
					return proposedAddress;
				}

				return getBowerOptions().then(function(options){
					var rootBowerConfig = options.rootBowerConfig;
					var bowerPath = options.bowerPath;

					var deps = bower.dependencies;

					if(deps[load.name]) {
						var depBowerPath = steal.joinURIs(bowerPath, load.name + "/");
						var depBowerJson = depBowerPath + "bower.json";

            // Cache a copy of this dependency's own `bower.json` so that we can
            // look at it's contents in the future without fetching a new copy.
						depMains[load.name] = depMains[load.name] ||
							getBowerJson(depBowerJson);
						return depMains[load.name].then(function(depBower) {
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
