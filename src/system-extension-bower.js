
var bowerConfiged = function(loader){
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
        return {
          bowerPath: res[0],
          bowerAddress: res[1]
        };
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

	function withoutJs(name) {
		var len = name.length;
		if(name.substr(len - 3) === ".js") {
			return name.substr(0, len - 3);
		}
		return name;
	}

	function applyPackageConfig(packageName, bowerAddress, bowerPath) {
		return getBowerJSON(bowerAddress).then(function(bower) {
			var main = bower.main;
			if(packageName && main) {
				main = typeof main === "string" ? main : main[0];

				loader.paths[packageName + "/*"] = bowerPath + "/" + packageName + "/*.js";
				loader.packages[packageName] = {
					main: withoutJs(main)
				};
			}
			var deps = bower.dependencies || {},
				depPromises = [],
				depAddress;
			for(var depName in deps) {
				depAddress = bowerPath + "/" + depName + "/bower.json";
				depPromises.push(
					applyPackageConfig(depName, depAddress, bowerPath)
				);
			}

			return Promise.all(depPromises);
		});
	}


	var loaderNormalize = loader.normalize;
	loader.normalize = function(name, parentName, parentAddress){
  	if(name === this.main && this.bower) {
			return getBowerOptions().then(function(options){
        return applyPackageConfig(null, options.bowerAddress, options.bowerPath);
			}).then(function() {
        return loaderNormalize.call(loader, name, parentName, parentAddress);
      });
		}
		return loaderNormalize.apply(this, arguments);
	};
};

if(typeof System !== "undefined") {
	bowerConfiged(System);
}
