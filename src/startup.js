	

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
	
			// Grab startFile
			startFile = parts[0];
	
			if (startFile) {
				options.startId = startFile;
			}
	
			// Grab env
			env = parts[1];
	
			if (env) {
				options.env = env;
			}
	
			// Split on / to get rootUrl
			parts = src.split("/");
			var lastPart = parts.pop();
			
			if(lastPart.indexOf("steal") === 0 && !System.paths["steal/dev/dev"]) {
				options.paths = {
					"steal/*": parts.join("/")+"/*.js",
					"@traceur": parts.slice(0,-1).join("/")+"/traceur/traceur.js"
				};
				
			}
			
			if ( last(parts) === "steal" ) {
				parts.pop();
				if ( last(parts) === "bower_components" ) {
					parts.pop();
				}
			}
			var root = parts.join("/");
			options.root = root+"/";
			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						 attr.nodeName.replace("data-","") :
						 attr.nodeName );
						 
				options[optionName] = attr.value;
			});
			
		}
	
		return options;
	};
	
	var getOptionsFromStealLocation = function(){
		var options = {};
		if(typeof __dirname === "string" && !System.paths["steal/dev/dev"]) {
			options.paths = {
				"steal/*": __dirname+"/*.js",
				"@traceur": __dirname.split("/").slice(0,-1).join("/")+"/traceur/traceur.js"
			};
		}
		return options;
	};
	
	steal.startup = function(config){
		
		// get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			var urlOptions = getOptionsFromStealLocation();
		}
		if(!System.map.css) {
			System.map.css = "steal/css";	
		}

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		steal.config(urlOptions);
		
		var options = steal.config();
	
		// mark things that have already been loaded
		each(options.executed || [], function( i, stel ) {
			System.register(stel,[],function(){});
		});
		
		// immediate steals we do
		var steals = [];
	
		// add start files first
		if ( options.startIds ) {
			/// this can be a string or an array
			steals.push.apply(steals, isString(options.startIds) ? [options.startIds] : options.startIds);
			options.startIds = steals.slice(0);
		}
	
		// we only load things with force = true
		if ( options.env == "production" ) {
			
			return appDeferred = steal.System.import(steal.System.main)["catch"](function(e){
				console.log(e);
			});
			
		} else if(options.env == "development"){
			
			configDeferred = steal.System.import("stealconfig");
			
			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
 				// what was loaded in stealconfig.js
				if(config) {
					steal.config(config);
				}

				return steal("steal/dev");
			},function(){
				console.log("steal - error loading stealconfig.");
				return steal("steal/dev");
			});
			
			appDeferred = devDeferred.then(function(){
				
				// if there's a main, get it, otherwise, we are just loading
				// the config.
				return steal.System.main ? 
					System.import(steal.System.main):
					configDeferred;
			}).then(function(){
				if(steal.dev) {
					steal.dev.log("app loaded successfully")
				}
			}, function(error){
				console.log("error",error,  error.stack);
			});
			return appDeferred;
		}
	};

	return steal;	
};
