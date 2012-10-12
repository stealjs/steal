// steal is a resource loader for JavaScript.  It is broken into the following parts:
//
// - Helpers - basic utility methods used internally
// - AOP - aspect oriented code helpers
// - Deferred - a minimal deferred implementation
// - Uri - methods for dealing with urls
// - Api - steal's API
// - Resource - an object that represents a resource that is loaded and run and has dependencies.
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

	/*# resource.js #*/

	/*# init.js #*/

	/*# config.js #*/
	
	/*# amd.js #*/

	/*# static.js #*/

	/*# types.js #*/

	/*# packages.js #*/

	/*# startup.js #*/

	/*# interactive.js #*/


	
	steal.File = steal.URI = URI;

	var stealResource = new Resource("steal")
	stealResource.value = steal;
	stealResource.loaded.resolve();
	stealResource.run.resolve();
	stealResource.executing = true;
	stealResource.completed.resolve();

	resources[stealResource.options.id] = stealResource;

	h.startup();
	//win.steals = steals;
	h.win.steal.resources = resources;
	h.win.Resource = Resource;

})();
