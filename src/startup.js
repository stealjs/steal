	var getScriptOptions = function (script) {
		var options = {},
			parts, src, query, startFile, env;

		options.stealURL = script.src;
		// Split on question mark to get query

		each(script.attributes, function(attr){
			var optionName =
				camelize( attr.nodeName.indexOf("data-") === 0 ?
					attr.nodeName.replace("data-","") :
					attr.nodeName );
			options[optionName] = (attr.value === "") ? true : attr.value;
		});

		// main source within steals script is deprecated
		// and will be removed in future releases
		var source = script.innerHTML;
		if(/\S/.test(source)){
			options.mainSource = source;
		}


		return options;
	};

	var getUrlOptions = function (){
		return new Promise(function(resolve, reject){

			// Get options from the script tag
			if (isWebWorker) {
				resolve({
					stealURL: location.href
				});

			} else if(isBrowserWithWindow) {
				// if the browser supports currentScript, us it!
				if (document.currentScript) {
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

	steal.startup = function(config){
		appPromise = getUrlOptions().then(function(urlOptions) {

			if (typeof config === 'object') {
				// the url options are the source of truth
				config = extend(config, urlOptions);
			} else {
				config = urlOptions;
			}

			// set the config
			System.config(config);

			setEnvsConfig.call(this.System);

			// Read the env now because we can't overwrite everything yet

			// immediate steals we do
			var steals = [];

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
