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

	/*# config.js #*/
	
	/*# amd.js #*/

	/*# static.js #*/

	/*# types.js #*/

	//  ============================== Packages ===============================
	/**
	 * @function steal.packages
	 * `steal.packages( packageIds... )` defines modules for deferred downloading.
	 * 
	 * This is used by the build system to build collections of modules that will be downloaded
	 * after initial page load.
	 * 
	 * For example, an application that wants to progressively load the contents and
	 * dependencies of _login/login.js_, _filemanager/filemanager.js_, and _contacts/contacts.js_,
	 * while immediately loading the current users's data might look like:
	 * 
	 *     steal.packages('login','filemanager','contacts')
	 *     steal('models/user', function(User){
	 * 	   
	 *       // get the current User
	 *       User.findOne({id: "current"}, 
	 * 
	 *         // success - they logged in
	 *         function(user){
	 *           if(window.location.hash == "#filemanager"){
	 *             steal('filemanager')  
	 *           }
	 *         }, 
	 *         // error - they are logged out
	 *         function(){
	 *           steal('login', function(){
	 *             new Login(document.body);
	 *             // preload filemanager
	 * 
	 *           })  
	 *         })
	 *     })
	 * 
	 *
	 * 		steal.packages('tasks','dashboard','fileman');
	 *
	 */
	var packs = [],
		packHash = {};
	steal.packages = function( map ) {

		if (!arguments.length ) {
			return packs;
		} else {
			if ( typeof map == 'string' ) {
				packs.push.apply(packs, arguments);
			} else {
				packHash = map;
			}

			return this;
		}
	};

	/*# startup.js #*/

	/*# interactive.js #*/
	
	var stealResource = new Resource("steal")
	stealResource.value = steal;
	stealResource.loaded.resolve();
	stealResource.run.resolve();
	stealResource.executing = true;
	stealResource.completed.resolve();

	resources[stealResource.options.id] = stealResource;

	h.startup();
	//win.steals = steals;
	win.steal.resources = resources;
	h.win.Resource = Resource;

})();
