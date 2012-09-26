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
	
	/**
	 * @function steal.id
	 * 
	 * Given a resource id passed to `steal( resourceID, currentWorkingId )`, this function converts it to the 
	 * final, unique id. This function can be overwritten 
	 * to change how unique ids are defined, for example, to be more AMD-like.
	 * 
	 * The following are the default rules.
	 * 
	 * Given an ID:
	 * 
	 *  1. Check the id has an extension like _.js_ or _.customext_. If it doesn't:
	 *      1. Check if the id is relative, meaning it starts with _../_ or _./_. If it is not, add 
	 *         "/" plus everything after the last "/". So `foo/bar` becomes `foo/bar/bar`
	 *      2. Add .js to the id.
	 *  2. Check if the id is relative, meaning it starts with _../_ or _./_. If it is relative,
	 *     set the id to the id joined from the currentWorkingId.
	 *  3. Check the 
	 * 
	 * 
	 * `steal.id()`
	 */
	// returns the "rootSrc" id, something that looks like requireJS
	// for a given id/path, what is the "REAL" id that should be used
	// this is where substituation can happen
	steal.id = function( id, currentWorkingId, type ) {
		// id should be like
		var uri = URI(id);
		uri = uri.addJS().normalize(currentWorkingId ? new URI(currentWorkingId) : null)
		// check foo/bar
		if (!type ) {
			type = "js"
		}
		if ( type == "js" ) {
			// if it ends with .js remove it ...
			// if it ends
		}
		// check map config
		var map = stealConfig.map || {};
		// always run past 
		h.each(map, function( loc, maps ) {
			// is the current working id matching loc
			if ( matchesId(loc, currentWorkingId) ) {
				// run maps
				h.each(maps, function( part, replaceWith ) {
					if (("" + uri).indexOf(part) == 0 ) {
						uri = URI(("" + uri).replace(part, replaceWith))
					}
				})
			}
		})
		
		return uri;
	}

	



	// for a given ID, where should I find this resource
	/**
	 * `steal.idToUri( id, noJoin )` takes an id and returns a URI that
	 * is the location of the file. It uses the paths option of  [steal.config].
	 * Passing true for `noJoin` does not join from the root URI.
	 */
	steal.idToUri = function( id, noJoin ) {
		// this is normalize
		var paths = stealConfig.paths || {},
			path;
		// always run past 
		h.each(paths, function( part, replaceWith ) {
			path = ""+id;
			// if path ends in / only check first part of id
			if((h.endsInSlashRegex.test(part) && path.indexOf(part) == 0) ||
				// or check if its a full match only
				path === part){
				id = URI(path.replace(part, replaceWith));
			}
		})

		return noJoin ? id : stealConfig.root.join(id)
	}




	

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
			options.id = steal.id(options.id, curId);
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



	// ### TYPES ##
	var types = stealConfig.types;
	/**
	 * Registers a type.  You define the type of the file, the basic type it
	 * converts to, and a conversion function where you convert the original file
	 * to JS or CSS.  This is modeled after the
	 * [http://api.jquery.com/extending-ajax/#Converters AJAX converters] in jQuery.
	 *
	 * Types are designed to make it simple to switch between steal's development
	 * and production modes.  In development mode, the types are converted
	 * in the browser to allow devs to see changes as they work.  When the app is
	 * built, these converter functions are run by the build process,
	 * and the processed text is inserted into the production script, optimized for
	 * performance.
	 *
	 * Here's an example converting files of type .foo to JavaScript.  Foo is a
	 * fake language that saves global variables defined like.  A .foo file might
	 * look like this:
	 *
	 *     REQUIRED FOO
	 *
	 * To define this type, you'd call steal.type like this:
	 *
	 *     steal.type("foo js", function(options, original, success, error){
	 *       var parts = options.text.split(" ")
	 *       options.text = parts[0]+"='"+parts[1]+"'";
	 *       success();
	 *     });
	 *
	 * The method we provide is called with the text of .foo files in options.text.
	 * We parse the file, create JavaScript and put it in options.text.  Couldn't
	 * be simpler.
	 *
	 * Here's an example,
	 * converting [http://jashkenas.github.com/coffee-script/ coffeescript]
	 * to JavaScript:
	 *
	 *     steal.type("coffee js", function(options, original, success, error){
	 *       options.text = CoffeeScript.compile(options.text);
	 *       success();
	 *     });
	 *
	 * In this example, any time steal encounters a file with extension .coffee,
	 * it will call the given converter method.  CoffeeScript.compile takes the
	 * text of the file, converts it from coffeescript to javascript, and saves
	 * the JavaScript text in options.text.
	 *
	 * Similarly, languages on top of CSS, like [http://lesscss.org/ LESS], can
	 * be converted to CSS:
	 *
	 *     steal.type("less css", function(options, original, success, error){
	 *       new (less.Parser)({
	 *         optimization: less.optimization,
	 *         paths: []
	 *       }).parse(options.text, function (e, root) {
	 *         options.text = root.toCSS();
	 *         success();
	 *       });
	 *     });
	 *
	 * This simple type system could be used to convert any file type to be used
	 * in your JavaScript app.  For example, [http://fdik.org/yml/ yml] could be
	 * used for configuration.  jQueryMX uses steal.type to support JS templates,
	 * such as EJS, TMPL, and others.
	 *
	 * @param {String} type A string that defines the new type being defined and
	 * the type being converted to, separated by a space, like "coffee js".
	 *
	 * There can be more than two steps used in conversion, such as "ejs view js".
	 * This will define a method that converts .ejs files to .view files.  There
	 * should be another converter for "view js" that makes this final conversion
	 * to JS.
	 *
	 * @param {Function} cb( options, original, success, error ) a callback
	 * function that converts the new file type to a basic type.  This method
	 * needs to do two things: 1) save the text of the converted file in
	 * options.text and 2) call success() when the conversion is done (it can work
	 * asynchronously).
	 *
	 * - __options__ - the steal options for this file, including path information
	 * - __original__ - the original argument passed to steal, which might be a
	 *   path or a function
	 * - __success__ - a method to call when the file is converted and processed
	 *   successfully
	 * - __error__ - a method called if the conversion fails or the file doesn't
	 *   exist
	 */
	steal.config.types = function(types){
		h.each(types, steal.type)
	};

	/*# resource.js #*/

	

	steal.
	/**
	 * Called for every file that is loaded.  It sets up a string of methods called
	 * for each type in the conversion chain and calls each type one by one.
	 *
	 * For example, if the file is a coffeescript file, here's what happens:
	 *
	 *   - The "text" type converter is called first.  This will perform an AJAX
	 *   request for the file and save it in options.text.
	 *   - Then the coffee type converter is called (the user provided method).
	 *   This converts the text from coffeescript to JavaScript.
	 *   - Finally the "js" type converter is called, which inserts the JavaScript
	 *   in the page as a script tag that is executed.
	 *
	 * @param {Object} options the steal options for this file, including path information
	 * @param {Function} success a method to call when the file is converted and processed successfully
	 * @param {Function} error a method called if the conversion fails or the file doesn't exist
	 */
	require = function( options, success, error ) {
		// add the src option
		options.src = steal.idToUri(options.id);

		// get the type
		var type = types[options.type],
			converters;

		// if this has converters, make it get the text first, then pass it to the type
		if ( type.convert.length ) {
			converters = type.convert.slice(0);
			converters.unshift("text", options.type)
		} else {
			converters = [options.type]
		}
		require(options, converters, success, error)
	};

	function require(options, converters, success, error) {

		var type = types[converters.shift()];

		type.require(options, function require_continue_check() {
			// if we have more types to convert
			if ( converters.length ) {
				require(options, converters, success, error)
			} else { // otherwise this is the final
				success.apply(this, arguments);
			}
		}, error)
	};


	/*# types.js #*/
	


	// =============================== HELPERS ===============================
	var factory = function() {
		return win.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
	};


	steal.
	/**
	 * Performs an XHR request
	 * @param {Object} options
	 * @param {Function} success
	 * @param {Function} error
	 */
	request = function( options, success, error ) {
		var request = new factory(),
			contentType = (options.contentType || "application/x-www-form-urlencoded; charset=utf-8"),
			clean = function() {
				request = check = clean = null;
			},
			check = function() {
				var status;
				if ( request && request.readyState === 4 ) {
					status = request.status;
					if ( status === 500 || status === 404 || status === 2 || request.status < 0 || (!status && request.responseText === "") ) {
						error && error(request.status);
					} else {
						success(request.responseText);
					}
					clean();
				}
			};
		request.open("GET", options.src + '', !(options.async === false));
		request.setRequestHeader("Content-type", contentType);
		if ( request.overrideMimeType ) {
			request.overrideMimeType(contentType);
		}

		request.onreadystatechange = check;
		try {
			request.send(null);
		}
		catch (e) {
			if ( clean ) {
				console.error(e);
				error && error();
				clean();
			}
		}

	};


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

	

	

	// =============================== STARTUP ===============================
	var rootSteal = false;

	// essentially ... we need to know when we are on our first steal
	// then we need to know when the collection of those steals ends ...
	// and, it helps if we use a 'collection' steal because of it's natural
	// use for going through the pending queue
	//
	h.extend(steal, {
		// modifies src
/*makeOptions : after(steal.makeOptions,function(raw){
			raw.src = URI.root().join(raw.rootSrc = URI( raw.rootSrc ).insertMapping());
		}),*/

		//root mappings to other locations
		mappings: {},

		/**
		 * Maps a 'rooted' folder to another location.
		 * @param {String|Object} from the location you want to map from.  For example:
		 *   'foo/bar'
		 * @param {String} [to] where you want to map this folder too.  Ex: 'http://foo.cdn/bar'
		 * @return {steal}
		 */
		map: function( from, to ) {
			if ( h.isString(from) ) {
				steal.mappings[from] = {
					test: new RegExp("^(\/?" + from + ")([/.]|$)"),
					path: to
				};
				h.each(resources, function( id, resource ) {
					if ( resource.options.type != "fn" ) {
						// TODO terrible
						var buildType = resource.options.buildType;
						resource.setOptions(resource.orig);
						resource.options.buildType = buildType;
					}
				})
			} else { // its an object
				h.each(from, steal.map);
			}
			return this;
		},
		// called after steals are added to the pending queue
		after: function() {
			// if we don't have a current 'top' steal
			// we create one and set it up
			// to start loading its dependencies (the current pending steals)
			if (!rootSteal ) {
				rootSteal = new Resource();
				// keep a reference in case it disappears
				var cur = rootSteal,
					// runs when a steal is starting
					go = function() {
						// indicates that a collection of steals has started
						steal.trigger("start", cur);
						cur.completed.then(function() {

							rootSteal = null;
							steal.trigger("end", cur);


						});

						cur.executed();
					};
				// If we are in the browser, wait a
				// brief timeout before executing the rootResource.
				// This allows embeded script tags with steal to be part of 
				// the initial set
				if ( win.setTimeout ) {
					// we want to insert a "wait" after the current pending
					steal.pushPending();
					setTimeout(function() {
						steal.popPending();
						go();
					}, 0)
				} else {
					// if we are in rhino, start loading dependencies right away
					go()
				}
			}
		},
		_before: h.before,
		_after: h.after
	});

	(function(){
		var myPending;
		steal.pushPending = function(){
			myPending = pending.slice(0);
			pending = [];
			h.each(myPending, function(i, arg){
				Resource.make(arg);
			})
		}
		steal.popPending = function(){
			pending = myPending.concat(null,pending);
		}
	})();

	// =============================== jQuery ===============================
	(function() {
		var jQueryIncremented = false,
			jQ, ready = false;

		// check if jQuery loaded after every script load ...
		Resource.prototype.executed = h.before(Resource.prototype.executed, function() {

			var $ = win.jQuery;
			if ( $ && "readyWait" in $ ) {

				//Increment jQuery readyWait if ncecessary.
				if (!jQueryIncremented ) {
					jQ = $;
					$.readyWait += 1;
					jQueryIncremented = true;
				}
			}
		});

		// once the current batch is done, fire ready if it hasn't already been done
		steal.bind("end", function() {
			if ( jQueryIncremented && !ready ) {
				jQ.ready(true);
				ready = true;
			}
		})


	})();






	// =========== DEBUG =========


    /*var name = function(stel){
		if(stel.options && stel.options.type == "fn"){
			return stel.orig.name? stel.orig.name : stel.options.id+":fn";//(""+stel.orig).substr(0,10)
		}
		return stel.options ? stel.options.id + "": "CONTAINER"
	}


	//Resource.prototype.load = before( Resource.prototype.load, function(){
	//	console.log("      load", name(this), this.loading, steal._id, this.id)
	//})

	Resource.prototype.executed = before(Resource.prototype.executed, function(){
		var namer= name(this)
		console.log("      executed", namer, steal._id, this.id)
	})
	
	Resource.prototype.complete = before(Resource.prototype.complete, function(){
		console.log("      complete", name(this), steal._id, this.id)
	})*/



	// ============= WINDOW LOAD ========
	var addEvent = function( elem, type, fn ) {
		if ( elem.addEventListener ) {
			elem.addEventListener(type, fn, false);
		} else if ( elem.attachEvent ) {
			elem.attachEvent("on" + type, fn);
		} else {
			fn();
		}
	},
		loaded = {
			load: Deferred(),
			end: Deferred()
		},
		firstEnd = false;

	addEvent(win, "load", function() {
		loaded.load.resolve();
	});

	steal.one("end", function( collection ) {
		loaded.end.resolve(collection);
		firstEnd = collection;
		steal.trigger("done", firstEnd)
	})
	steal.firstComplete = loaded.end;

	Deferred.when(loaded.load, loaded.end).then(function() {
		steal.trigger("ready")
		steal.isReady = true;
	});

	steal.events.done = {
		add: function( cb ) {
			if ( firstEnd ) {
				cb(firstEnd);
				return false;
			} else {
				return cb;
			}
		}
	};



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

	h.startup = h.after(h.startup, function() {
		// get options from 
		var options = {};

		// A: GET OPTIONS
		// 1. get script options
		h.extend(options, steal.getScriptOptions());

		// 2. options from a steal object that existed before this steal
		h.extend(options, h.opts);

		// 3. if url looks like steal[xyz]=bar, add those to the options
		// does this ened to be supported anywhere?
		var search = win.location && decodeURIComponent(win.location.search);
		search && search.replace(/steal\[([^\]]+)\]=([^&]+)/g, function( whoe, prop, val ) {
			options[prop] = ~val.indexOf(",") ? val.split(",") : val;
		});

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		steal.config(options);
		

		// mark things that have already been loaded
		h.each(options.executed || [], function( i, stel ) {
			steal.executed(stel)
		})
		// immediate steals we do
		var steals = [];

		// add start files first
		if ( options.startFiles ) {
			/// this can be a string or an array
			steals.push.apply(steals, h.isString(options.startFiles) ? [options.startFiles] : options.startFiles)
			options.startFiles = steals.slice(0)
		}

		// either instrument is in this page (if we're the window opened from
		// steal.browser), or its opener has it
		// try-catching this so we dont have to build up to the iframe
		// instrumentation check
		try {
			// win.top.steal.instrument is for qunit
			// win.top.opener.steal.instrument is for funcunit
			if(!options.browser && ((win.top && win.top.steal.instrument) || 
									(win.top && win.top.opener && win.top.opener.steal && win.top.opener.steal.instrument))) {

				// force startFiles to load before instrument
				steals.push(h.noop, {
					id: "steal/instrument",
					waits: true
				});
			}
		} catch (e) {
			// This would throw permission denied if
			// the child window was from a different domain
		}

		// we only load things with force = true
		if ( stealConfig.env == "production" && stealConfig.loadProduction && stealConfig.production ) {
			steal({
				id: stealConfig.production,
				force: true
			});
		} else {
			steals.unshift("stealconfig.js")

			if ( options.loadDev !== false ) {
				steals.unshift({
					id: "steal/dev/dev.js",
					ignore: true
				});
			}

			if ( options.startFile ) {
				steals.push(null,options.startFile)
			}
		}
		if ( steals.length ) {
			steal.apply(win, steals);
		}
	});


	// ## AMD ##
	var modules = {

	};

	// convert resources to modules ...
	// a function is a module definition piece
	// you steal(moduleId1, moduleId2, function(module1, module2){});
	// 
	win.define = function( moduleId, dependencies, method ) {
		if (dependencies && method && !dependencies.length ) {
			modules[moduleId] = method();
		}
	}
	win.define.amd = {
		jQuery: true
	}


	//steal.when = when;
	// make steal public
	win.steal = steal;


	// make steal loaded
	define("steal", [], function() {
		return steal;
	});

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
