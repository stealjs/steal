/*
 * @hide
 * `new ConfigManager(config)` creates configuration profile for the steal context.
 * It keeps all config parameters in the instance which allows steal to clone it's 
 * context.
 *
 * config.stealConfig is tipically set up in __stealconfig.js__.  The available options are:
 * 
 *  - map - map an id to another id
 *  - paths - maps an id to a file
 *  - root - the path to the "root" folder
 *  - env - `"development"` or `"production"`
 *  - types - processor rules for various types
 *  - ext - behavior rules for extensions
 *  - urlArgs - extra queryString arguments
 *  - startId - the file to load
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
 * 
 */



var ConfigManager = function(options){
	this.stealConfig = {};
	this.callbacks = [];
	this.attr(ConfigManager.defaults);
	this.attr(options)
}
/**
 * @add steal.config
 */
h.extend(ConfigManager.prototype, {
	// get or set config.stealConfig attributes
	attr: function( config ) {
		if(!config){ // called as a getter, so just return
			return this.stealConfig;
		}
		if(arguments.length === 1 && typeof config === "string"){ // called as a getter, so just return
			return this.stealConfig && this.stealConfig[config];
		}
		this.stealConfig = this.stealConfig || {};
		for(var prop in config){
			var value = config[prop];
			// if it's a special function
			this[prop] ?
				// run it
				this[prop](value) :
				// otherwise set or extend
				(typeof value == "object" && this.stealConfig[prop] ?
					// extend
					h.extend( this.stealConfig[prop], value) :
					// set
					this.stealConfig[prop] = value);
				
		}

		for(var i = 0; i < this.callbacks.length; i++){
			this.callbacks[i](this.stealConfig)
		}
		
		return this;
	},
	
	// add callbacks which are called after config is changed
	on: function(cb){
		this.callbacks.push(cb)
	},

	// get the current start file
	/**
	 * @attribute startId
	 * 
	 * `steal.config("startId", startModuleId )` configures the
	 * first file that steal loads. This is important for 
	 * builds.
	 * 
	 * 
	 */
	startId: function(startFile){
		// make sure startFile and production look right
		this.stealConfig.startId = "" + URI(startFile).addJS()
		if (!this.stealConfig.productionId ) {
			this.stealConfig.productionId = URI(this.stealConfig.startId).dir() + "/production.js";
		}
	},

	/**
	 * @attribute root
	 * Read or define the path relative URI's should be referenced from.
	 * 
	 *     window.location //-> "http://foo.com/site/index.html"
	 *     st.URI.root("http://foo.com/app/files/")
	 *     st.root.toString() //-> "../../app/files/"
	 */
	root: function( relativeURI ) {
		if ( relativeURI !== undefined ) {
			var root = URI(relativeURI);

			// the current folder-location of the page http://foo.com/bar/card
			var cleaned = URI.page,
				// the absolute location or root
				loc = cleaned.join(relativeURI);

			// cur now points to the 'root' location, but from the page
			URI.cur = loc.pathTo(cleaned)
			this.stealConfig.root = root;
			return this;
		}
		this.stealConfig.root =  root || URI("");
	},
	//var stealConfig = configs[configContext];
	cloneContext: function(){
		return new ConfigManager( h.extend( {}, this.stealConfig ) );
	}
})
// ConfigManager's defaults
ConfigManager.defaults = {
	types: {},
	/**
	 * @attribute ext
	 * 
	 * `steal.config("ext", extensionConfig)` configures
	 * processing behavior of moduleId extensions. For example:
	 * 
	 *     steal.config("ext",{
	 *       js: "js",
	 *       css: "css",
	 *       less: "steal/less/less.js",
	 *       mustache: "can/view/mustache/mustache.js"
	 *     })
	 * 
	 * `extensionConfig` maps a filename extension to
	 * be processed by a [steal.config.types type] 
	 * (like `js: "js"`) or to a dependency moduleId that
	 * defines that type (like `less: "steal/less/less.js"`).
	 * 
	 */
	ext: {},
	/**
	 * @attribute env
	 * 
	 * `steal.config("env", environment )` configures steal's 
	 * environment to either:
	 * 
	 *  - `'development'` - loads all modules seperately
	 *  - `'production'` - load modules in minified production scripts and styles.
	 * 
	 * 
	 * ## Setting Env
	 * 
	 * Typically, changing the environment is done by changing
	 * `steal/steal.js` to `steal/steal.production.js` like:
	 * 
	 *     <script src="../steal/steal.production.js?myapp">
	 *     </script>
	 * 
	 * It can also be set in the queryparams like:
	 * 
	 *     <script src="../steal/steal.js?myapp,production">
	 *     </script>
	 * 
	 * Or set before steal is loaded like:
	 * 
	 *     <script>
	 *     steal = {env: "production"}
	 *     </script>
	 *     <script src="../steal/steal.js?myapp">
	 *     </script>
	 * 
	 * Of course, it can also be set in `stealconfig.js`, but you
	 * probably shouldn't.
	 * 
	 * 
	 */
	env: "development",
	/**
	 * @attribute loadProduction
	 * 
	 * `steal.config("loadProduction",loadProduction)` indicates
	 * 
	 */
	loadProduction: true,
	logLevel: 0,
	root: "",
	amd: false
	/**
	 * @attribute map
	 * 
	 * `steal.config( "map", mapConfig )` maps
	 * moduleIds to other moduleIds when stolen
	 * in a particular location. 
	 * 
	 * The following maps "jquery/jquery.js" to
	 * `"jquery-1.8.3.js" in "filemanager" and 
	 * "jquery/jquery.js" to `"jquery-1.4.2.js"` in
	 * "taskmanager":
	 * 
	 *     steal.config({
	 *       maps: {
	 *         filemanager: {
	 * 	         "jquery/jquery.js": "jquery-1.8.3.js"
	 *         },
	 *         taskmanager: {
	 *           "jquery/jquery.js": "jquery-1.4.2.js"
	 *         }
	 *       }
	 *     });
	 * 
	 * In _filemanager/filemanager.js_:
	 * 
	 *     steal('jquery')
	 * 
	 * ... will load `jquery-1.8.3.js`. To configure the location of 
	 * `jquery-1.8.3.js`, use [steal.config.paths].
	 * 
	 * To map ids within any location, use "*":
	 * 
	 *     steal.config({
	 *       maps: {
	 *         "*": {
	 * 	         "jquery/jquery.js": "jquery-1.8.3.js"
	 *         }
	 *       }
	 *     });
	 * 
	 * ## mapConfig
	 * 
	 * `mapConfig` is a map of a "require-er" moduleId 
	 * to a mapping of ids like:
	 * 
	 *     {
	 * 	      "require-er" : {requiredId: moduleId}
	 *     }
	 * 
	 * where:
	 * 
	 *   - __require-er__ is a moduleId or folderId where the `requiredId`
	 *     is stolen.
	 *   - __requiredId__ is the id returned by [steal.id].
	 *   - __moduleId__ is the moduleId that will be retrieved.
	 */
	//
	/**
	 * @attribute paths
	 * 
	 * `steal.config( "paths", pathConfig )` maps moduleIds
	 * to paths.  This is used to 
	 * override [steal.idToUri]. Often, this can be used to
	 * specify loading from a CDN like:
	 * 
	 *     steal.config({
	 *       paths: {
	 *         "jquery" : "http://cdn.google.com/jquery"
	 *       }
	 *     });
	 * 
	 * To keep loading jQuery in production from the CDN, use
	 * [steal.config.shim] and set the "exclude" option.
	 */
	//
	/**
	 * @attribute productionId 
	 * `steal.config("productionId", productionid )` configures
	 * the id to load the production package. It defaults
	 * to replacing [steal.config.startId] 
	 * with "`production.js`". For example,
	 * `myapp/myapp.js` becomes `myapp/production.js`.
	 * 
	 * The best way to configure `productionId` is 
	 * with a `steal` object before steal.js is loaded:
	 * 
	 *     <script>
	 *     steal = {productionId: "myapp/myapp.production.js"}
	 *     </script>
	 *     <script src="../steal/steal.js?myapp">
	 *     </script>
	 * 
	 * If you change `productionId`, make sure you change
	 * your build script.
	 */
	//
};