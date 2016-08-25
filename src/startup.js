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
			// get option, remove "data" and camelize
			var optionName =
				camelize( attr.nodeName.indexOf("data-") === 0 ?
					attr.nodeName.replace("data-","") :
					attr.nodeName );
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
			} else if(isBrowserWithWindow) {
				// if the browser supports currentScript, us it!
				if (document.currentScript) {
					// get options from script tag and query
					resolve(getScriptOptions(document.currentScript));
					return;
				}

				// dealing with async & deferred scripts
				// set an onload handler for all script tags and the first one which executes
				// is your stealjs
				var scripts = document.scripts;
				function onLoad() {
					for (var i = 0; i < scripts.length; ++i) {
						scripts[i].removeEventListener('load', onLoad, false);
					}
					resolve(getScriptOptions(event.target));
				}
				for (var i = 0; i < scripts.length; ++i) {
					scripts[i].addEventListener('load', onLoad, false);
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
	steal.startup = function(config){
		var steal = this;

		appPromise = getUrlOptions().then(function(urlOptions) {

			if (typeof config === 'object') {
				// the url options are the source of truth
				config = extend(config, urlOptions);
			} else {
				config = urlOptions;
			}

			// set the config
			System.config(config);

			setEnvsConfig.call(steal.System);

			// we only load things with force = true
			if (System.loadBundles) {

				if (!System.main && System.isEnv("production") && !System.stealBundled) {
					// prevent this warning from being removed by Uglify
					var warn = console && console.warn || function () {
						};
					warn.call(console, "Attribute 'main' is required in production environment. Please add it to the script tag.");
				}

				configPromise = System["import"](System.configMain);

				return configPromise.then(function (cfg) {
					setEnvsConfig.call(System);
					return System.main ? System["import"](System.main) : cfg;
				});

			} else {
				configPromise = System["import"](System.configMain);

				devPromise = configPromise.then(function () {
					setEnvsConfig.call(System);
					setupLiveReload.call(System);

					// If a configuration was passed to startup we'll use that to overwrite
					// what was loaded in stealconfig.js
					// This means we call it twice, but that's ok
					if (config) {
						System.config(config);
					}

					return System["import"]("@dev");
				});

				return devPromise.then(function () {
					// if there's a main, get it, otherwise, we are just loading
					// the config.
					if (!System.main || System.env === "build") {
						return configPromise;
					}
					var main = System.main;
					if (typeof main === "string") {
						main = [main];
					}
					return Promise.all(map(main, function (main) {
						return System["import"](main);
					}));
				});
			}
		}).then(function(){
			if(System.mainSource) {
				return System.module(System.mainSource);
			}

			// load script modules they are tagged as
			// text/steal-module
			return System.loadScriptModules();
		});

		return appPromise;
	};
	steal.done = function(){
		return appPromise;
	};
