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

	function stealManager(kickoff, stealConfiguration){
		
		/*# module.js #*/

		var st = function() {
			
			// convert arguments into an array
			var args = h.map(arguments);
			if ( args.length ) {
				Module.pending.push.apply(Module.pending, args);
				// steal.after is called everytime steal is called
				// it kicks off loading these files
				st.after(args);
				// return steal for chaining
			}

			return st;
		};

		st.clone = function(){
			return stealManager(false, h.extend({}, stealConfiguration))
		}

		st.config = stealConfiguration

		st.config.on(function(){
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
		})

		st._id = Math.floor(1000 * Math.random());

		/*# config.js #*/
		
		/*# amd.js #*/

		/*# static.js #*/

		/*# types.js #*/

		/*# packages.js #*/

		/*# startup.js #*/

		/*# interactive.js #*/

		st.File = st.URI = URI;

		if(kickoff){
			var stealModule = new Module("steal")
			stealModule.value = st;
			stealModule.loaded.resolve();
			stealModule.run.resolve();
			stealModule.executing = true;
			stealModule.completed.resolve();

			resources[stealModule.options.id] = stealModule;
		}
		

		h.startup();
		//win.steals = steals;
		st.resources = resources;
		h.win.Module = Module;

		return st;
	}

	/*# init.js #*/

	window.steal = stealManager(true, configManager())
	
	

})();
