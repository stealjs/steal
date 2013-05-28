// steal is a resource loader for JavaScript.  It is broken into the following parts:
//
// - Helpers - basic utility methods used internally
// - AOP - aspect oriented code helpers
// - Deferred - a minimal deferred implementation
// - Uri - methods for dealing with urls
// - Api - steal's API
// - Module - an object that represents a resource that is loaded and run and has dependencies.
// - Type - a type systems used to load and run different types of resources
// - Packages -  used to define packages
// - Extensions - makes steal pre-load a type based on an extension (ex: .coffee)
// - Mapping - configures steal to load resources in a different location
// - Startup - startup code
// - jQuery - code to make jQuery's readWait work
// - Error Handling - detect scripts failing to load
// - Has option - used to specify that one resources contains multiple other resources
// - Window Load - API for knowing when the window has loaded and all scripts have loaded
// - Interactive - Code for IE
// - Options - 
(function( undefined ) {

	/*# helpers.js #*/

	/*# deferred.js #*/

	/*# uri.js #*/

	/*# config_manager.js #*/

	/*# types.js #*/

	/*# module.js #*/

	function stealManager(kickoff, config, setStealOnWindow){

		// a startup function that will be called when steal is ready
		var interactiveScript,
			// key is script name, value is array of pending items
			interactives = {},
			// empty startup function
			startup = function(){};
		
		var st = function() {
			
			// convert arguments into an array
			var args = h.map(arguments, function(options){
				if(options){
					var opts = h.isString(options) ? {
						id: options
					} : options;
					
					if( !opts.idToUri ){
						opts.idToUri =  st.idToUri
					} 
					return opts;
				} else {
					return options;
				}
			});
			if ( args.length ) {
				Module.pending.push.apply(Module.pending, args);
				// steal.after is called everytime steal is called
				// it kicks off loading these files
				st.after(args);
				// return steal for chaining
			}

			return st;
		};
		if(setStealOnWindow){
			h.win.steal = st;
		}
		/**
		 * @add steal
		 */
		// clone steal context
		st.clone = function(){
			return stealManager(false, config.cloneContext())
		}
		/**
		 * @function steal.config
		 * 
		 * @signature `steal.config( configOptions )`
		 * Configures the behavior of steal. For example:
		 * 
		 *     steal.config({
		 *       map: {
		 *         "*": {
		 *           "jquery/jquery.js" : "jquery",
		 *           "can/util/util.js": "can/util/jquery/jquery.js"
		 *         }
		 *       },
		 *       paths: {
		 *         "jquery": "can/lib/jquery.1.8.3.js",
		 *       },
		 *       shim : {
		 *         jquery: {
		 *           exports: "jQuery"
		 *         }
		 *       },
		 *       ext: {
		 *         js: "js",
		 *         css: "css",
		 *         less: "steal/less/less.js",
		 *         coffee: "steal/coffee/coffee.js",
		 *       }
		 *     });
		 * 
		 * This sets the [steal.config.map map], [steal.config.paths paths],
		 * [steal.config.shim shim], and [steal.config.ext ext].
		 * 
		 * @signature `steal.config(optionName)`
		 * Returns a configuration option value. Example:
		 * 
		 *     steal.config("env") //-> "development"
		 * 
		 * @signature `steal.config(optionName, optionVal)`
		 * Configures a specific option value. Example:
		 * 
		 *     steal.config("env","production")
		 * 
		 * Steal supports the following configuration options:
		 * 
		 * - [steal.config.map map] - maps ids passed to steal to another id.
		 * - [steal.config.paths paths] - maps ids to a specific path.
		 * - [steal.config.shim shim] - used to support libraries that don't use steal.
		 * - [steal.config.ext ext] - specifies a dependency to load for specific extensions
		 * - [steal.config.startId startId] - the first module to load
		 * - [steal.config.root root] - the root folder where everything is loaded from
		 * - [steal.config.types types] - types used to load modules 
		 * - [steal.config.env env] - the enviornement: "development" or "production"
		 * - [steal.config.loadProduction loadProduction] - load the production script in production environment
		 * - [steal.config.amd amd] - turn on AMD support.
		 * - [steal.config.completed completed] - tells steal that a dependency 
		 *   has already been loaded.
		 * 
		 * 
		 * 
		 * ## Alternative methods of setting config options
		 * 
		 * After `steal.js` is loaded and run, you can call `steal.config`
		 * anywhere.  However, after `steal.js` loads,
		 * it automatically loads `stealconfig.js` before it loads 
		 * anything else. `stealconfig.js` is the best place to 
		 * configure settings that should be applied to all 
		 * projects. But, there are other ways of
		 * calling `steal.config`.
		 * 
		 * ### Set startFile and env in the script tag
		 * 
		 * You can set startFile and env the queryparams of steal like:
		 * 
		 *     <script src='../steal/steal.js?STARTFILE,ENV'>
		 *     </script>
		 * 
		 * For example:
		 * 
		 *     <script src='../steal/steal.js?cookbook,production'>
		 *     </script>
		 * 
		 * If you load `steal/steal.production.js` the environment defaults
		 * to production:
		 * 
		 *     <script src='../steal/steal.production.js?cookbook'>
		 *     </script>
		 * 
		 * ### A `steal` object that exists before `steal.js` is loaded
		 * 
		 * If a `steal` object exists before `steal.js` is loaded,
		 * steal will internally call `steal.config` with that 
		 * object.  For example:
		 * 
		 *     <script>
		 *     steal = {
		 *       completed: "myapp/production.css"
		 *     }
		 *     </script>
		 *     <script src='../steal/steal.production.js,myapp'>
		 *     </script>
		 * 
		 * ## Locating StealJS and other libraries outside the root folder.
		 * 
		 * Its common desire to want steal and other projects in
		 * some shared folder and the application code somewhere 
		 * else.  For example:
		 * 
		 *     shared/
		 *         steal/
		 *         can/
		 *         stealconfig.js
		 *     apps/
		 *         myapp/
		 *           myapp.js
		 * 
		 * This is possible by changing [steal.config.root] to
		 * point `apps` and  
		 * [steal.config.paths] to point to the shared 
		 * location.  For example, the following in stealconfig.js
		 * will work for the case above:
		 * 
		 *     paths: {
		 *       "can/": "../shared/can/",
		 *       "steal/" : "../shared/steal/",
		 *     },
		 *     root: steal.config('root').join('../apps')
		 * 
		 * ## Signatures
		 * 
		 * ### `steal.config()`
		 * 
		 * Returns all configured properties. For example:
		 * 
		 *     steal.config().root //-> URI
		 * 
		 * ### `steal.config(propertyName)`
		 * 
		 * Returns a single configured property value. For example:
		 * 
		 *     steal.config("root") //-> URI
		 * 
		 * ### `steal.config(properties)`
		 * 
		 * Configures multiple properties at once. For example:
		 * 
		 *     steal.config({root: "path/to/root"})
		 * 
		 */
		st.config = function(){
			st.config.called = true;
			return config.attr.apply(config, arguments)
		};
		st.require = function(){
			return config.require.apply(config, arguments);
		}
		st.config.called = false;
		st._id = Math.floor(1000 * Math.random());

		/*# config.js #*/
		
		/*# amd.js #*/

		/*# static.js #*/

		/*# packages.js #*/

		var Module = moduleManager(st, modules, interactives, config);
		resources  = Module.modules; 

		/*# shim.js #*/

		/*# startup.js #*/

		/*# interactive.js #*/

		// Use config.on to listen on changes in config. We primarily use this
		// to update resources' paths when stealconfig.js is loaded.
		config.on(function(configData){
			h.each(resources, function( id, resource ) {
				resource.rewriteIdAndUpdateOptions(id);
			});
			// set up shims after ids are updated
			if(configData.shim){
				st.setupShims(configData.shim)
			}
			if(configData.completed){
				h.each( h.isString(configData.completed) ? 
						[configData.completed] : configData.completed, function(i, id){
						Module.make({id: id}).executed()
				});
			}
		})

		st.File = st.URI = URI;

		// if this is a first steal context in the page
		// we need to set up the `steal` module so we would 
		// know steal was loaded.
		if(kickoff){
			var stealModule = new Module({id:"steal"})
			stealModule.value = st;
			stealModule.loaded.resolve();
			stealModule.run.resolve();
			stealModule.executing = true;
			stealModule.completed.resolve();
			resources[stealModule.options.id] = stealModule;
		}

		startup();
		st.resources = resources;
		st.Module = Module;

		return st;
	}
	// create initial steal instance
	stealManager(true, new ConfigManager(typeof h.win.steal == "object" ? h.win.steal : {}), true)

})();
