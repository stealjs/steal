/**
 * `steal.config(config)` configures steal. Typically it it used
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
 *     steal.config({
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
 *     steal.config({
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
 *     steal.config({ext: {"ejs": "can/view/ejs/ejs.js"}})
 * 
 * This tells steal to make sure `can/view/ejs/ejs.js` is executed before any file with
 * ".ejs" is executed.
 * 
 * ## startFile
 */
steal.config = function( config ) {
	if(!config){ // called as a getter, so just return
		return stealConfig;
	}
	if(arguments.length === 1 && typeof config === "string"){ // called as a getter, so just return
		return stealConfig[config];
	}
	for(var prop in config){
		var value = config[prop]
		// if it's a special function
		steal.config[prop] ?
			// run it
			steal.config[prop](value) :
			// otherwise set or extend
			(typeof value == "object" && stealConfig[prop] ?
				// extend
				h.extend( stealConfig[prop], value) :
				// set
				stealConfig[prop] = value);
			
	}
	// redo all resources
	h.each(resources, function( id, resource ) {
		if ( resource.options.type != "fn" ) {
			// TODO this is terrible
			var buildType = resource.options.buildType;
			resource.setOptions(resource.orig);
			var newId = resource.options.id;
			// this mapping is to move a config'd key
			if ( id !== newId ) {
				resources[newId] = resource;
				// TODO: remove the old one ....
			}
			resource.options.buildType = buildType;
		}
	})
	return stealConfig;
};
steal.config.startFile = function(startFile){
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
 *     steal.URI.root("http://foo.com/app/files/")
 *     steal.root.toString() //-> "../../app/files/"
 */
steal.config.root = function( relativeURI ) {
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
steal.config.root("");
steal.config.shim = function(shims){

	for(var id in shims){
		var resource = Resource.make(id);
		if(typeof shims[id] === "object"){
			var needs = shims[id].deps || []
			if(typeof shims[id].exports === "string"){
				var exports = (function(_exports){
					return function(){
						return win[_exports];
					}
				})(shims[id].exports)
			} else {
				exports = shims[id].exports;
			}
		} else {
			needs = shims[id];
		}
		(function(_resource, _needs){
			_resource.options.needs = _needs;
		})(resource, needs)

		if(exports){
			resource.exports = (function(_resource, _exports, _needs){
				return function(){
					var args = _needs.map(function(id){
						return Resource.make(id).value;
					})
					_resource.value = _exports.apply(null, args)
					return _resource.value
				}
			})(resource, exports, needs)
		}
	}

}