function configManager(configContext){
	configContext = configContext || "_";
	var configs = {
		"_" : {
			types: {},
			ext: {},
			env: "development",
			loadProduction: true,
			logLevel: 0
		}
	},
	callbacks = [],
	/**
	 * `config(config)` configures st. Typically it it used
	 * in __stealconfig.js__.  The available options are:
	 * 
	 *  - map - map an id to another id
	 *  - paths - maps an id to a file
	 *  - root - the path to the "root" folder
	 *  - env - `"development"` or `"production"`
	 *  - types - processor rules for various types
	 *  - ext - behavior rules for extensions
	 *  - urlArgs - extra queryString arguments
	 *  - startFile - the file to load
	 * 
	 * ## map
	 * 
	 * Maps an id to another id with a certain scope of other ids. This can be
	 * used to use different modules within the same id or map ids to another id.
	 * Example:
	 * 
	 *     st.config({
	 *       map: {
	 *         "*": {
	 *           "jquery/jquery.js": "jquery"
	 *         },
	 *         "compontent1":{
	 *           "underscore" : "underscore1.2"
	 *         },
	 *         "component2":{
	 *           "underscore" : "underscore1.1"  
	 *         }
	 *       }
	 *     })
	 * 
	 * ## paths
	 * 
	 * Maps an id or matching ids to a url. Each mapping is specified
	 * by an id or part of the id to match and what that 
	 * part should be replaced with.
	 * 
	 *     st.config({
	 *       paths: {
	 * 	       // maps everything in a jquery folder like: `jquery/controller`
	 *         // to http://cdn.com/jquery/controller/controller.com
	 * 	       "jquery/" : "http://cdn.com/jquery/"
	 * 
	 *         // if path does not end with /, it matches only that id
	 *         "jquery" : "https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"
	 *       }
	 *     }) 
	 * 
	 * ## root
	 * ## env
	 * 
	 * If production, does not load "ignored" scripts and loads production script.  If development gives more warnings / errors.
	 * 
	 * ## types
	 * 
	 * The types option can specify how a type is loaded. 
	 * 
	 * ## ext
	 * 
	 * The ext option specifies the default behavior if file is loaded with the 
	 * specified extension. For a given extension, a file that configures the type can be given or
	 * an existing type. For example, for ejs:
	 * 
	 *     st.config({ext: {"ejs": "can/view/ejs/ejs.js"}})
	 * 
	 * This tells steal to make sure `can/view/ejs/ejs.js` is executed before any file with
	 * ".ejs" is executed.
	 * 
	 * ## startFile
	 */
	configFn = function( config ) {
		var stealConfig = configs[configContext];
		if(!config){ // called as a getter, so just return
			return stealConfig;
		}
		if(arguments.length === 1 && typeof config === "string"){ // called as a getter, so just return
			return stealConfig && stealConfig[config];
		}
		stealConfig = stealConfig || {};
		for(var prop in config){
			var value = config[prop];
			// if it's a special function
			configFn[prop] ?
				// run it
				configFn[prop](value) :
				// otherwise set or extend
				(typeof value == "object" && stealConfig[prop] ?
					// extend
					h.extend( stealConfig[prop], value) :
					// set
					stealConfig[prop] = value);
				
		}

		for(var i = 0; i < callbacks.length; i++){
			callbacks[i]()
		}
		
		return stealConfig;
	};

	configFn.on = function(cb){
		callbacks.push(cb)
	}

	configFn.startFile = function(startFile){
		var stealConfig = configs[configContext];
		// make sure startFile and production look right
		stealConfig.startFile = "" + URI(startFile).addJS()
		if (!stealConfig.production ) {
			stealConfig.production = URI(stealConfig.startFile).dir() + "/production.js";
		}
		
	}

	/**
	 * Read or define the path relative URI's should be referenced from.
	 * 
	 *     window.location //-> "http://foo.com/site/index.html"
	 *     st.URI.root("http://foo.com/app/files/")
	 *     st.root.toString() //-> "../../app/files/"
	 */
	configFn.root = function( relativeURI ) {
		var stealConfig = configs[configContext];
		if ( relativeURI !== undefined ) {
			var root = URI(relativeURI);

			// the current folder-location of the page http://foo.com/bar/card
			var cleaned = URI.page,
				// the absolute location or root
				loc = cleaned.join(relativeURI);

			// cur now points to the 'root' location, but from the page
			URI.cur = loc.pathTo(cleaned)
			stealConfig.root = root;
			return;
		}
		stealConfig.root =  root || URI("");
	}
	configFn.root("");

	configFn.shim = function(shims){
		for(var id in shims){
			var resource = Module.make(id);
			if(typeof shims[id] === "object"){
				var needs   = shims[id].deps || []
				var exports = shims[id].exports;
				var init    = shims[id].init
			} else {
				needs = shims[id];
			}
			(function(_resource, _needs){
				_resource.options.needs = _needs;
			})(resource, needs);
			resource.exports = (function(_resource, _needs, _exports, _init){
				return function(){
					var args = [];
					h.each(_needs, function(i, id){
						args.push(Module.make(id).value);
					});
					if(_init){
						_resource.value = _init.apply(null, args);
					} else {
						_resource.value = h.win[_exports];
					}
				}
			})(resource, needs, exports, init)
		}
	}

	
	return configFn;
}