	// get config by the URL query
	// like ?main=foo&env=production
	// formally used for Webworkers
	var getQueryOptions = function(url) {
		var queryOptions = {},
			urlRegEx = /Url$/,
			urlParts = url.split("?"),
			path = urlParts.shift(),
			search = urlParts.join("?"),
			searchParts = search.split("&"),
			paths = path.split("/"),
			lastPart = paths.pop(),
			stealPath = paths.join("/");

		if(searchParts.length && searchParts[0].length) {
				var searchPart;
			for(var i =0; i < searchParts.length; i++) {
				searchPart = searchParts[i];
				var paramParts = searchPart.split("=");
				if(paramParts.length > 1) {
					var optionName = camelize(paramParts[0]);
					// make options uniform e.g. baseUrl => baseURL
					optionName = optionName.replace(urlRegEx, "URL")
					queryOptions[optionName] = paramParts.slice(1).join("=");
				}
			}
		}
		return queryOptions;
	};

	// extract the script tag options
	var getScriptOptions = function (script) {
		var scriptOptions = {},
			urlRegEx = /Url$/;

		scriptOptions.stealURL = script.src;

		each(script.attributes, function(attr){
			var nodeName = attr.nodeName || attr.name;
			// get option, remove "data" and camelize
			var optionName =
				camelize( nodeName.indexOf("data-") === 0 ?
					nodeName.replace("data-","") :
					nodeName );
			// make options uniform e.g. baseUrl => baseURL
			optionName = optionName.replace(urlRegEx, "URL")
			scriptOptions[optionName] = (attr.value === "") ? true : attr.value;
		});

		// main source within steals script is deprecated
		// and will be removed in future releases
		var source = script.innerHTML;
		if(/\S/.test(source)){
			scriptOptions.mainSource = source;
		}
		// script config ever wins!
		return extend(getQueryOptions(script.src), scriptOptions);
	};

	// get steal URL
	// if we are in a browser, we need to know which script is steal
	// to extract the script tag options => getScriptOptions()
	var getUrlOptions = function (){
		return new Promise(function(resolve, reject){

			// for Workers get options from steal query
			if (isWebWorker) {
				resolve(extend({
					stealURL: location.href
				}, getQueryOptions(location.href)));
				return;
			} else if(isBrowserWithWindow || isNW || isElectron) {
				// if the browser supports currentScript, use it!
				if (document.currentScript) {
					// get options from script tag and query
					resolve(getScriptOptions(document.currentScript));
					return;
				}
				// assume the last script on the page is the one loading steal.js
				else {
					var scripts = document.scripts;

					if (scripts.length) {
						resolve(getScriptOptions(scripts[scripts.length - 1]));
					}
				}
			} else {
				// or the only option is where steal is.
				resolve({
					stealPath: __dirname
				});
			}
		})
	};

	// configure and startup steal
	// load the main module(s) if everything is configured
	steal.startup = function(startupConfig){
		var steal = this;
		var loader = this.loader;
		var configResolve;
		var configReject;

		configPromise = new Promise(function(resolve, reject){
			configResolve = resolve;
			configReject = reject;
		});

		appPromise = getUrlOptions().then(function(urlOptions) {
			var config;

			if (typeof startupConfig === 'object') {
				// the url options are the source of truth
				config = extend(startupConfig, urlOptions);
			} else {
				config = urlOptions;
			}

			// set the config
			loader.config(config);

			setEnvsConfig.call(loader);

			// we only load things with force = true
			if (loader.loadBundles) {

				if (!loader.main && loader.isEnv("production") &&
					!loader.stealBundled) {
					// prevent this warning from being removed by Uglify
					warn("Attribute 'main' is required in production environment. Please add it to the script tag.");
				}

				loader["import"](loader.configMain)
				.then(configResolve, configReject);

				return configPromise.then(function (cfg) {
					setEnvsConfig.call(loader);
					return loader.main ? loader["import"](loader.main) : cfg;
				});

			} else {
				// devBundle includes the same modules as "depsBundle and it also
				// includes the @config graph, so it should be loaded before of
				// configMain
				loader["import"](loader.devBundle)
					.then(function() {
						return loader["import"](loader.configMain);
					})
					.then(function() {
						// depsBundle includes the dependencies in the node_modules
						// folder so it has to be loaded after configMain finished
						// loading
						return loader["import"](loader.depsBundle);
					})
					.then(configResolve, configReject);

				devPromise = configPromise.then(function () {
					setEnvsConfig.call(loader);
					setupLiveReload.call(loader);

					// If a configuration was passed to startup we'll use that to overwrite
					// what was loaded in stealconfig.js
					// This means we call it twice, but that's ok
					if (config) {
						loader.config(config);
					}

					return loader["import"]("@dev");
				});

				return devPromise.then(function () {
					// if there's a main, get it, otherwise, we are just loading
					// the config.
					if (!loader.main || loader.localLoader) {
						return configPromise;
					}
					var main = loader.main;
					if (typeof main === "string") {
						main = [main];
					}
					return Promise.all(map(main, function (main) {
						return loader["import"](main);
					}));
				});
			}
		}).then(function(main){
			if(loader.mainSource) {
				return loader.module(loader.mainSource);
			}

			// load script modules they are tagged as
			// text/steal-module
			loader.loadScriptModules();

			return main;
		});

		return appPromise;
	};
	steal.done = function(){
		return appPromise;
	};
