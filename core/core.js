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
(function( win, undefined ) {

	/*# helpers.js #*/
	
	/*# deferred.js #*/

	/*# uri.js #*/

	/*# resource.js #*/
		
	// create the steal function now to use as a namespace.

	function steal() {
		// convert arguments into an array
		var args = h.map(arguments);
		if ( args.length ) {
			pending.push.apply(pending, args);
			// steal.after is called everytime steal is called
			// it kicks off loading these files
			steal.after(args);
			// return steal for chaining
		}
		return steal;
	};
	steal._id = Math.floor(1000 * Math.random());
	// ## CONFIG ##
	
	// stores the current config settings
	var stealConfig = {
		types: {},
		ext: {},
		env: "development",
		loadProduction: true,
		logLevel: 0
	},
	
		matchesId = function( loc, id ) {
			if ( loc === "*" ) {
				return true;
			} else if ( id.indexOf(loc) === 0 ) {
				return true;
			}
		};

	/*# config.js #*/
	
	/*# amd.js #*/

	// temp add steal.File for backward compat
	steal.File = steal.URI = URI;
	// --- END URI
	var pending = [],
		s = steal,
		id = 0;


	/**
	 * @add steal
	 */
	// =============================== STATIC API ===============================
	var page;

	h.extend(steal, {
		each: h.each,
		extend: h.extend,
		Deferred: Deferred,
		// Currently used a few places
		isRhino: win.load && win.readUrl && win.readFile,
		/**
		 * @hide
		 * Makes options
		 * @param {Object} options
		 */
		makeOptions: function( options, curId ) {
			// convert it to a uri
			if (!options.id ) {
				throw {
					message: "no id",
					options: options
				}
			}
			options.id = options.toId ? options.toId(options.id, curId) : steal.id(options.id, curId);
			// set the ext
			options.ext = options.id.ext();
			
			// Check if it's a configured needs
			var configedExt = stealConfig.ext[options.ext];
			// if we have something, but it's not a type
			if ( configedExt && ! stealConfig.types[configedExt] ) {
				if (!options.needs ) {
					options.needs = [];
				}
	
				options.needs.push(configedExt);
			}
			
			return options;
		},
		/**
		 * Calls steal, but waits until all previous steals
		 * have completed loading until loading the
		 * files passed to the arguments.
		 */
		then: function() {
			var args = h.map(arguments);
			args.unshift(null)
			return steal.apply(win, args);
		},
		/**
		 * `steal.bind( event, handler(eventData...) )` listens to 
		 * events on steal. Typically these are used by various build processes
		 * to know when steal starts and finish loading resources and their
		 * dependencies. Listen to an event like:
		 * 
		 *     steal.bind('end', function(rootResource){
		 *       rootResource.dependencies // the first stolen resources.
		 *     })
		 * 
		 * Steal supports the following events:
		 * 
		 *  - __start__ - steal has started loading a group of resources and their dependencies.
		 *  - __end__ - steal has finished loading a group of resources and their dependencies.
		 *  - __done__ - steal has finished loading the first set of resources and their dependencies.
		 *  - __ready__ - after both steal's "done" event  and the `window`'s onload event have fired.
		 * 
		 * For example, the following html:
		 * 
		 * @codestart html
		 * &lt;script src='steal/steal.js'>&lt;/script>
		 * &lt;script>
		 * steal('can/control', function(){
		 *   setTimeout(function(){
		 *     steal('can/model')    
		 *   },200)
		 * })
		 * &lt;/script>
		 * @codeend
		 * 
		 * Would fire:
		 * 
		 *  - __start__ - immediately after `steal('can/control')` is called
		 *  - __end__ - after 'can/control', all of it's dependencies, and the callback function have executed and completed.
		 *  - __done__ - fired after the first 'end' event.
		 *  - __ready__ - fired after window.onload and the 'done' event
		 *  - __start__ - immediately after `steal('can/model')` is called
		 *  - __end__ - fired after 'can/model' and all of it's dependencies have fired.
		 * 
		 * 
		 * 
		 * @param {String} event
		 * @param {Function} listener
		 */
		bind: function( event, listener ) {
			if (!events[event] ) {
				events[event] = []
			}
			var special = steal.events[event]
			if ( special && special.add ) {
				listener = special.add(listener);
			}
			listener && events[event].push(listener);
			return steal;
		},
		/**
		 * `steal.one(eventName, handler(eventArgs...) )` works just like
		 * [steal.bind] but immediately unbinds after `handler` is called.
		 */
		one: function( event, listener ) {
			return steal.bind(event, function() {
				listener.apply(this, arguments);
				steal.unbind(event, arguments.callee);
			});
		},
		events: {},
		/**
		 * `steal.unbind( eventName, handler )` removes an event listener on steal.
		 * @param {String} event
		 * @param {Function} listener
		 */
		unbind: function( event, listener ) {
			var evs = events[event] || [],
				i = 0;
			while ( i < evs.length ) {
				if ( listener === evs[i] ) {
					evs.splice(i, 1);
				} else {
					i++;
				}
			}
		},
		trigger: function( event, arg ) {
			var arr = events[event] || [];
			// array items might be removed during each iteration (with unbind),
			// so we iterate over a copy
			h.each(h.map(arr), function( i, f ) {
				f(arg);
			})
		},
		/**
		 * @hide
		 * Creates resources and marks them as loading so steal doesn't try 
		 * to load them. 
		 * 
		 *      steal.has("foo/bar.js","zed/car.js");
		 * 
		 * This is used when a file has other resources in it. 
		 */
		has: function() {
			// we don't use IE's interactive script functionality while
			// production scripts are loading
			h.support.interactive = false;
			h.each(arguments, function( i, arg ) {
				var stel = Resource.make(arg);
				stel.loading = stel.executing = true;
			});
		},

		// a dummy function to add things to after the stel is created, but before executed is called
		preexecuted: function() {},
		/**
		 * @hide
		 * Signals that a resource's JS code has been run.  This is used
		 * when a file has other resources in it.
		 * 
		 *     steal.has("foo/bar.js");
		 * 
		 *     //start code for foo/bar.js 
		 *     steal("zed/car.js", function(){ ... });
		 *     steal.executed("foo/bar.js");
		 * 
		 * When a resource is executed, its dependent resources are loaded and eventually 
		 * executed.
		 */
		// called when a script has loaded via production
		executed: function( name ) {
			// create the steal, mark it as loading, then as loaded
			var resource = Resource.make(name);
			resource.loading = resource.executing = true;
			//convert(stel, "complete");
			steal.preexecuted(resource);
			resource.executed()
			return steal;
		},
		type: function( type, cb ) {
			var typs = type.split(" ");

			if (!cb ) {
				return types[typs.shift()].require
			}

			types[typs.shift()] = {
				require: cb,
				convert: typs
			};
		}
	});


	


	var events = {};


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
	
	// ## Config ##
	var stealCheck = /steal\.(production\.)?js.*/,
		getStealScriptSrc = function() {
			if (!h.doc ) {
				return;
			}
			var scripts = h.getElementsByTagName("script"),
				script;

			// find the steal script and setup initial paths.
			h.each(scripts, function( i, s ) {
				if ( stealCheck.test(s.src) ) {
					script = s;
				}
			});
			return script;
		};

	steal.getScriptOptions = function( script ) {

		var options = {},
			parts, src, query, startFile, env;

		script = script || getStealScriptSrc();

		if ( script ) {

			// Split on question mark to get query
			parts = script.src.split("?");
			src = parts.shift();
			query = parts.join("?");

			// Split on comma to get startFile and env
			parts = query.split(",");

			if ( src.indexOf("steal.production") > -1 ) {
				options.env = "production";
			}

			// Grab startFile
			startFile = parts[0];

			if ( startFile ) {
				if ( startFile.indexOf(".js") == -1 ) {
					startFile += "/" + startFile.split("/").pop() + ".js";
				}
				options.startFile = startFile;
			}

			// Grab env
			env = parts[1];

			if ( env ) {
				options.env = env;
			}

			// Split on / to get rootUrl
			parts = src.split("/")
			parts.pop();
			if ( parts[parts.length - 1] == "steal" ) {
				parts.pop();
			}
			options.root = parts.join("/")

		}

		return options;
	};

	


	

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
	win.Resource = Resource;

})(this);
