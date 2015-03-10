	var getScriptOptions = function () {

		var options = {},
			parts, src, query, startFile, env,
			scripts = document.getElementsByTagName("script");

		var script = scripts[scripts.length - 1];

		if (script) {

			// Split on question mark to get query
			parts = script.src.split("?");
			src = parts.shift();
			query = parts.join("?");

			// Split on comma to get startFile and env
			parts = query.split(",");

			if (src.indexOf("steal.production") > -1) {
				options.env = "production";
			}

			if (parts[0]) {
				options.startId = parts[0];
			}
			// Grab env
			if (parts[1]) {
				options.env = parts[1];
			}

			// Split on / to get rootUrl
			parts = src.split("/");
			var lastPart = parts.pop();
			
			options.stealPath = parts.join("/");

			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						attr.nodeName.replace("data-","") :
						attr.nodeName );
				options[optionName] = (attr.value === "") ? true : attr.value;
			});

		}

		return options;
	};

	steal.startup = function(config){

		// Get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			// or the only option is where steal is.
			var urlOptions = {
				stealPath: __dirname
			};
		}

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		System.config(urlOptions);
		
		if(config){
			System.config(config);
		}

		// Read the env now because we can't overwrite everything yet

		// immediate steals we do
		var steals = [];

		// we only load things with force = true
		if ( System.env == "production" ) {

			configDeferred = System["import"](System.configMain);

			return appDeferred = configDeferred.then(function(cfg){
				return System.main ? System["import"](System.main) : cfg;
			})["catch"](function(e){
				console.log(e);
			});

		} else if(System.env == "development" || System.env == "build"){

			configDeferred = System["import"](System.configMain);

			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
				// what was loaded in stealconfig.js
				// This means we call it twice, but that's ok
				if(config) {
					System.config(config);
				}

				return System["import"]("@dev");
			},function(e){
				console.log("steal - error loading @config.",e);
				return steal.System["import"]("@dev");
			});

			appDeferred = devDeferred.then(function(){
				// if there's a main, get it, otherwise, we are just loading
				// the config.
				if(!System.main || System.env === "build") {
					return configDeferred;
				}
				var main = System.main;
				if(typeof main === "string") {
					main = [main];
				}
				return Promise.all( map(main,function(main){
					return System["import"](main)
				}) );
			}).then(null, function(error){
				console.log("error",error,  error.stack);
				throw error;
			});
			return appDeferred;
		}
	};
	steal.done = function(){
		return appDeferred;
	};
	return steal;

