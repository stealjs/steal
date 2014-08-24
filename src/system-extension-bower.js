
var bowerConfiged = function(loader){
	var rootBowerConfig, depMains = {};
  var bowerPath;
	var getBowerPath = function(stealPath){
		var path = steal.joinURIs(stealPath, "../bower.json");
		return path;
	};
	var getBowerJson = function(loader, bowerPath){
		return loader.fetch({
			address: bowerPath,
			metadata: {}
		}).then(function(bowerJson) {
			return JSON.parse(bowerJson);
		});
	};

	// overwrite config to trap when someone sets a config we can use to get
	// bowerPath from
	var oldConfig = loader.config;
	loader.config = function(cfg){
		if(typeof cfg === 'object') {
      // Get the bowerPath either from the `stealPath` or from `bowerPath`
      // if that option has been passed.

			if(cfg.stealPath && /bower_components/.test(cfg.stealPath)){
        bowerPath = steal.joinURIs(cfg.stealPath, "../bower.json");
			}
			if(cfg.bowerPath){
        bowerPath = cfg.bowerPath;
			}
      
      // If the Bower option is turned on and we have a bowerPath,
      // retrieve the bower.json as a Promise.
      if(cfg.bower && bowerPath) {
        rootBowerConfig = getBowerJson(this, bowerPath);
      }
		}

		return oldConfig.call(this, cfg)
	}

	// overwrite locate to load module's bower and get the real address
	var oldLocate = loader.locate;
	loader.locate = function(load){
		var promise = Promise.resolve(oldLocate.call(this, load));

		return promise.then(function(proposedAddress){
      // If Bower lookup is enabled get the value of the `bower.json` file
      // and see if this `load` is a dependency listed. If so retrieve it
      // and lookup it's own "main" that will be used as the address for this
      // module.
			if(rootBowerConfig) {
				return rootBowerConfig.then(function(bower) {
					var deps = bower.dependencies;
					if(deps[load.name]) {
						var depBowerPath = steal.joinURIs(this.baseURL, "bower_components/" +
																							 load.name + "/");
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
