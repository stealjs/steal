(function(){
	
	var // String constants (for better minification)
		win = (function(){return this}).call(null),
		STR_ONLOAD = "onload",
		STR_ONERROR = "onerror",
		STR_ONREADYSTATECHANGE = "onreadystatechange",
		STR_REMOVE_CHILD = "removeChild",
		STR_CREATE_ELEMENT = 'createElement',
		STR_GET_BY_TAG = 'getElementsByTagName',
		doc = win.document,
		noop = function(){},
		stateCheck = /loaded|complete/,
		// creates a script tag with an optional type
		scriptTag = function(type) {
			var start = doc[STR_CREATE_ELEMENT]('script');
			start.type = type || 'text/javascript';
			return start;
		},
		// a function that returns the head element
		head = function() {
			var d = doc,
				de = d.documentElement,
				heads = d[STR_GET_BY_TAG]("head"),
				hd = heads[0];
			if (! hd ) {
				hd = d[STR_CREATE_ELEMENT]('head');
				de.insertBefore(hd, de.firstChild);
			}
			// replace head so it runs fast next time.
			head = function(){
				return hd;
			}
			return hd;
		},
		// extends one object with another
		extend = function( d, s ) {
			for ( var p in s ) {
				d[p] = s[p];
			}
			return d;
		},
		makeArray = function(args){
			var arr= [];
			each(args, function(i, str){arr.push(str)});
			return arr;
		},
		each = function(arr, cb){
			for(var i =0, len = arr.length; i <len; i++){
				cb.call(arr[i],i,arr[i])
			}
		},
		support = {
			error: !win.document || "error" in scriptTag(),
			interactive: win.document && "attachEvent" in scriptTag()
		},
		startup = function(){},
		oldsteal = win.steal,
		opts = typeof oldsteal == 'object' ? oldsteal : {};

	// =============================== STEAL ===============================

	/**
	 * 
	 */
	function steal() {
		//set the inital
		var args = makeArray(arguments);
		steal.before(args);
		pending.push.apply(pending,  arguments);
		steal.after(args);
		return steal;
	};
	
	
	// =============================== PATHS .8 ============================

// things that matter ... 
//  - the current file being loaded
//  - the location of the page
//  - the file

	/**
	 * @class
	 * Used for getting information out of a path
	 * @constructor
	 * Takes a path
	 * @param {String} path 
	 */
	steal.File = function( path ) {
		if ( this.constructor != steal.File ) {
			return new steal.File(path);
		}
		this.path = typeof path == 'string'? path : path.path;
	};
	var File = steal.File,
		curFile;
		
	File.cur = function(newCurFile){
		if(newCurFile !== undefined){
			curFile = File(newCurFile);
		}else{
			return curFile || File("");
		}
	}
	extend(File.prototype,
	/* @prototype */
	{
		/**
		 * Removes hash and params
		 * @return {String}
		 */
		clean: function() {
			return this.path.match(/([^\?#]*)/)[1];
		},
		ext : function(){
			var match = this.clean().match(/\.([\w\d]+)$/)
			return match ? match[1] : "";
		},
		/**
		 * Returns everything before the last /
		 */
		dir: function() {
			var last = this.clean().lastIndexOf('/'),
				dir = (last != -1) ? this.clean().substring(0, last) : '',
				parts = dir !== '' && dir.match(/^(https?:\/|file:\/)$/);
			return parts && parts[1] ? this.clean() : dir;
		},
		/**
		 * Returns the domain for the current path.
		 * Returns null if the domain is a file.
		 */
		domain: function() {
			var http = this.path.match(/^(?:https?:\/\/)([^\/]*)/);
			return http ? http[1] : null;
		},
		/**
		 * Joins a url onto a path.  One way of understanding this is that your File object represents your current location, and calling join() is analogous to "cd" on a command line.
		 * @codestart
		 * new steal.File("d/e").join("../a/b/c"); // Yields the path "d/a/b/c"
		 * @codeend
		 * @param {String} url
		 */
		join: function( url ) {
			return File(url).joinFrom(this.path);
		},

		/**
		 * Returns the path of this file referenced from another url or path.
		 * @codestart
		 * new steal.File('a/b.c').joinFrom('/d/e')//-> /d/e/a/b.c
		 * @codeend
		 * @param {String} url
		 * @param {Boolean} expand if the path should be expanded
		 * @return {String} 
		 */
		joinFrom: function( url, expand ) {
			var u = File(url);
			if ( this.protocol() ) { //if we are absolutely referenced
				//try to shorten the path as much as possible:
				var firstDomain = this.domain(),
					secondDomain = u.domain();
				if ( firstDomain && firstDomain == secondDomain ) {
					// if there is no domain, we are on the file system
					return firstDomain ? this.afterDomain() :
						this.toReferenceFromSameDomain(url);
				} else {
					return this.path;
				}

			} else if ( url === steal.pageUrl().dir() && !expand ) {

				return this.path;

			} else if ( this.isLocalAbsolute() ) { // we are a path like /page.js

				return (u.domain() ? u.protocol() + "//" + u.domain() : "" )+ this.path;
			} else  { //we have 2 relative paths, remove folders with every ../
				
				if ( url === '' ) {
					return this.path.replace(/\/$/, '');
				}
				
				var urls = url.split('/'),
					paths = this.path.split('/'),
					path = paths[0];
				
				//if we are joining from a folder like cookbook/, remove the last empty part
				if ( url.match(/\/$/) ) {
					urls.pop();
				}
				// for each .. remove one folder
				while ( path == '..' && paths.length > 0 ) {
					// if we've emptied out, folders, just break
					// leaving any additional ../s
					if(! urls.pop() ){ 
						break;
					}
					paths.shift();
					
					path = paths[0];
				}
				return urls.concat(paths).join('/');
			}
		},
		/**
		 * Returns true if the file is relative to a domain or a protocol
		 */
		relative: function() {
			return this.path.match(/^(https?:|file:|\/)/) === null;
		},
		/**
		 * Returns the part of the path that is after the domain part
		 */
		afterDomain: function() {
			return this.path.match(/https?:\/\/[^\/]*(.*)/)[1];
		},
		/**
		 * Returns the relative path between two paths with common folders.
		 * @codestart
		 * new steal.File('a/b/c/x/y').toReferenceFromSameDomain('a/b/c/d/e')//-> ../../x/y
		 * @codeend
		 * @param {Object} url
		 * @return {String} 
		 */
		toReferenceFromSameDomain: function( url ) {
			var parts = this.path.split('/'),
				other_parts = url.split('/'),
				result = '';
			while ( parts.length > 0 && other_parts.length > 0 && parts[0] == other_parts[0] ) {
				parts.shift();
				other_parts.shift();
			}
			each(other_parts, function(){ result += '../'; })
			return result + parts.join('/');
		},
		/**
		 * Is the file on the same domain as our page.
		 */
		isCrossDomain: function() {
			return this.isLocalAbsolute() ? false : this.domain() != File(win.location.href).domain();
		},
		isLocalAbsolute: function() {
			return this.path.indexOf('/') === 0;
		},
		protocol: function() {
			var match = this.path.match(/^(https?:|file:)/);
			return match && match[0];
		},


		getAbsolutePath: function() {
			var dir = File.cur().dir(),
				fwd = File(dir);
			return fwd.relative() ? fwd.joinFrom(steal.root.path, true) : dir;
		},
		/**
		 * For a given path, a given working directory, and file location, update the path so 
		 * it points to a location relative to steal's root.
		 * 
		 * We want everything relative to steal's root so the same app can work in multiple pages.
		 * 
		 * On different domains ...
		 */
		normalize: function() {

			var current = File.cur().dir(),
				//if you are cross domain from the page, and providing a path that doesn't have an domain
				path = this.path;

			if (/^\/\//.test(this.path) ) { //if path is rooted from steal's root 
				path = this.path.substr(2);
			
			} else if(/^\.\//.test(this.path) ){ // should be relative
				this.path = this.path.substr(2);
				path = this.joinFrom(current);
				this.path = "./"+this.path;
			} else if ( this.relative() 
					|| (File.cur().isCrossDomain() && //if current file is on another domain and
						!this.protocol()) ) { //this file doesn't have a protocol
				path = this.joinFrom(current);
			}
			return path;
		}
	});
	
		// the 
	var pending = [],
		s = steal,
		id = 0,
		steals = {};

	steal.p = {
		// adds a new steal and throws an error if the script doesn't load
		// this also checks the steals map
		make: function(options){
			
			var stel = new steal.p.init(options),
				rootSrc = stel.options.rootSrc;
				
			if(stel.unique && rootSrc){
				// the .js is b/c we are not adding that automatically until
				// load because we defer 'type' determination until then
				if(!steals[rootSrc] && ! steals[rootSrc+".js"]){  //if we haven't loaded it before
					steals[rootSrc] = stel;
				} else{
					stel = steals[rootSrc];
				}
			}
			
			return stel;
		},
		/**
		 * @param {Object} options what to steal
		 * 
		 *  . waits - true if the steal should wait until everything 
		 *            before it is complete to load and run, false if it will load and run in
		 *            parallel.  This defaults to true for functions.
		 *  
		 *  . unique - true if this is a unique resource that 'owns' this url.  This is 
		 *             true for files, false for functions.
		 *             
		 *  . ignore - true if you want to not be built into production and loaded by production.
		 *  
		 *  . packaged - false if you want to still be loaded by production, but not in the build.
		 */
		init: function( options ) {
			this.dependencies = [];
			this.id = (++id);
			// if we have no options, we are the global init ... set ourselves up ...
			if(!options){ //global init cur ...
				this.waits = false;
				this.pack = "production.js";
			} 
			//handle callback functions	
			else if ( typeof options == 'function' ) {
				var path = File.cur().path;
				
				this.options = {
					fn : function() {
					
						//set the path ..
						File.cur(path);
						
						// call the function, someday soon this will be requireJS-like
						options(steal.send || win.jQuery || steal); 
					},
					rootSrc: path,
					orig: options,
					type: "fn"
				}
				// this has nothing to do with 'loading' options
				this.waits = true;
				this.unique = false;
			} else {
				
				// save the original options
				this.orig = options;

				this.options = steal.makeOptions(extend({},
					typeof options == 'string' ? { src: options } : options));

				this.waits = this.options.waits || false;
				this.unique = true;
			}
		},
		complete : function(){},
		/**
		 * @hide
		 * After the script has been loaded and run
		 * 
		 *   - check what else has been stolen, load them
		 *   - mark yourself as complete when everything is completed
		 *   - this is where all the actions is
		 */
		loaded: function(myqueue){
			//check if jQuery has been loaded
			//mark yourself as current
			File.cur(this.options && this.options.rootSrc);
			
			if(!myqueue){
				myqueue = pending.slice(0);
				pending = [];
			}
			
			// if we have nothing, mark us as complete
			if(!myqueue.length){
				this.complete();
				
				return;
			}
			
			// now we have to figure out how to wire up our steals
			var self = this,
				set = [],
				joiner, // the current 
				stel,
				initial = [],
				isProduction = steal.options.env == 'production',
				files = [],
				whenEach = function(arr, func, obj, func2){
					var big = [obj, func2];
					each(arr, function(i, item){
						big.unshift(item, func)
					});
					when.apply(steal, big);
				},
				whenThe = function(obj, func, items, func2){
					each(items, function(i, item){
						when(obj, func, item, func2)
					})
				};
			
			
			//now go through what you stole and hook everything up
			each(myqueue.reverse(), function(i, item){
				//check for ignored before even making ...
				if(isProduction && item.ignore){
					return;
				}
				
				// make a steal object
				stel = steal.p.make( item );
				
				// add it as a dependency, circular are not allowed
				self.dependencies.unshift(stel)
				
				
				if(stel.waits === false){ // file
					// on the current 
					files.push(stel);					
				}else{ // function
					
					// essentially have to bind current files to call previous joiner's load
					// and to wait for current stel's complete
					
					if(!joiner){
						
						// when they are complete, complete me
						whenEach(files.length ? files.concat(stel) : [stel], "complete", self, "complete");
						
						// if there was a function then files, then end, function loads all files
						if(files.length){
							whenThe(stel,"complete", files ,"load")
						}
						
					} else { //   function,  file1, file2, file3, joiner function
						
						whenEach(files.length ? files.concat(stel) : [stel], "complete", joiner, "load");
						
						// make stel complete load files
						whenThe(stel,"complete", files.length ? files : [joiner] ,"load")
						
						
						
					}
					joiner = stel;
					files = [];
					
				}
			});
			
			if(files.length){
				//we have initial files
				// if there is a joiner, we need to load it when the initial files are complete
				//console.log(this.options && this.options.src, files, joiner )
				if(joiner){
					whenEach(files, "complete", joiner, "load");
				} else {
					whenEach(files, "complete", self, "complete");
				}
				
				each(files, function(){
					this.load();
				});
			} else if(joiner){
				// we have inital function
				joiner.load()
			} else {
				self.complete();
			}

			
		},
		/**
		 * When the script loads, 
		 */
		load: function(returnScript) {
			if(this.loading){
				return;
			}
			this.loading = true;
			var self = this;
			// get yourself
			steal.require(this.options,this.orig, function(script, pending){
				self.loaded(pending);
			});
			
		}

	};
	steal.p.init.prototype = steal.p;
	
	// =============================== STATIC API ===============================
	var page;
	extend(steal,{
		root : File(""),
		rootUrl : function(src){
			if (src !== undefined) {
				steal.root = File(src);
				
				// set cur with the location
				
				var cleaned = steal.pageUrl(),
					loc = cleaned.join(src);
				File.cur( cleaned.toReferenceFromSameDomain(loc) );
				return steal;
			} else {
				return steal.root.path;
			}
		},
		extend : extend,
		pageUrl : function(newPage){
			if(newPage){
				page = File( File(newPage).clean() );
				return steal;
			} else{
				return page || File("");
			}
		},
		//gets and sets which page steal thinks it's at
		// TODO: make location change-able ...
		/**
		 * Gets
		 * @param {Object} file
		 */
		cur: function( file ) {
			if (file === undefined) {
				return File.cur();
			} else {
				File.cur(file);
				return steal;
			}
		},
		browser: {
			rhino: win.load && win.readUrl && win.readFile
		},
		options : {
			env : 'development',
			// TODO: document this
			loadProduction : true
		},
		/**
		 * when a 'unique' steal gets added ...
		 * @param {Object} stel
		 */
		add : function(stel){
			steals[stel.rootSrc] = stel;
		},
		/**
		 * Makes options
		 * @param {Object} options
		 */
		makeOptions : function(options){
			
			var orig = options.src,
				normalized = steal.File(orig).normalize();
			extend(options,{
				originalSrc : options.src,
				rootSrc : normalized,
				src : steal.root.join(normalized)
			});
			options.originalSrc = options.src;
			return options;
		},
		then : function(){
			var args = typeof arguments[0] == 'function' ? 
				arguments : [function(){}].concat(makeArray( arguments ) )
			return steal.apply(win, args );
		},
		callOnArgs: function( f ) {
			return function() {
				for ( var i = 0; i < arguments.length; i++ ) {
					f(arguments[i]);
				}
				return steal;
			};

		},
		bind: function(event, listener){
			if(!events[event]){
				events[event] = [] 
			}
			var special = steal.events[event]
			if(special && special.add){
				listener = special.add(listener);
			}
			listener && events[event].push(listener)
		},
		one : function(event, listener){
			steal.bind(event,function(){
				listener.apply(this, arguments);
				steal.unbind(arguments.callee);
			})
		},
		events : {},
		unbind : function(event, listener){
			var evs = events[event] || [],
				i = 0;
			while(i < evs.length){
				if(listener === evs[i]){
					evs.splice(i,1);
				}else{
					i++;
				}
			}
		},
		trigger : function(event, arg){
			each(events[event] || [], function(i,f){
				f(arg);
			})
		},
		/**
		 * @hide
		 * Used to tell steal that it is loading a number of plugins
		 */
		loading : function(){
			for(var i =0; i< arguments.length;i++){
				var stel = steal.p.make( arguments[i] );
				stel.loading = true;
			}

		},
		// called when a script has loaded via production
		loaded: function(name){
			// console.log("LOADED "+name)
			//get other steals
			//basically create each one ... mark it as loading
			//  load each one
			var stel = steal.p.make( name );
			stel.loading = true;
			var myqueue = pending.slice(0);
			pending = [];

			stel.loaded(myqueue)

			return steal;
		}
	});
	var events = {};
	
	
	var stealPlugin = function( p ) {
		return steal( typeof p == 'function' ? 
					  p :
				      (/^(http|\/)/.test(p) ? "": "//")+ p + '/' + getLastPart(p) );
	},
	getLastPart = function( p ) {
		return p.match(/[^\/]+$/)[0];
	};
	steal.plugins = steal.callOnArgs(stealPlugin);
	startup = before(startup, function(){
		
		steal.pageUrl(win.location ?  win.location.href : "");
		
	})
	
	
	// =============================== TYPE SYSTEM ===============================
	
	var types= {};
	
	/**
	 * Registers a type
	 * @param {String} type
	 * @param {Function} cb
	 */
	steal.type = function(type, cb){
		var typs = type.split(" ");
		
		if(!cb){
			return types[typs.shift()].require
		}
		
		types[typs.shift()] = {
			require : cb,
			convert: typs
		};
	};
	// adds a type (js by default) and buildType (css, js)
	// this should happen right before loading
	// however, what if urls are different 
	// because one file has JS and another does not?
	// we could check if it matches something with .js because foo.less.js SHOULD
	// be rare
	//steal.makeOptions = before(steal.makeOptions,function(raw){
		
	//});
	steal.p.load = before(steal.p.load, function(){
		var raw = this.options;
		
		// if it's a string, get it's extension and check if
		// it is a registered type, if it is ... set the type
		if(!raw.type){
			var ext = File(raw.src).ext();
			if(!ext && !types[ext]){
				ext = "js";
				raw.src += ".js"
			}
			raw.type =  ext;
		}
		var converters =  types[raw.type].convert;
		raw.buildType = converters.length ? converters[converters.length - 1] : raw.type;
	});
	
	// loads a single file, given a src (or text)
	steal.require = function(options, original, success, error){
		// get the type
		var type = types[options.type],
			converters;
		
		// if this has converters, make it get the text first, then pass it to the type
		if(type.convert.length){
			converters = type.convert.slice(0);
			converters.unshift('text', options.type)
		} else  {
			converters = [options.type]
		}
		require(options, original, converters, success, error)
	};
	function require(options, original, converters, success, error){
		
		var type = types[converters.shift()];
		
		type.require(options, original, function(){
			// if we have more types to convert
			if(converters.length){
				require(options, original, converters, success, error)
			} else { // otherwise this is the final
				success.apply(this, arguments);
			}
		}, error)
	};


// =============================== TYPES ===============================

var cleanUp = function(script) {
	script[ STR_ONREADYSTATECHANGE ]
		= script[ STR_ONLOAD ]
		= script[STR_ONERROR]
		= null;
		
	head()[ STR_REMOVE_CHILD ]( script );
};

steal.type("js", function(options,original, success, error){
	var script = scriptTag(), deps;
	if (options.text) {
		// insert
		script.text = options.text;
		
	}
	else {
		
		var callback = function(evt){
		
			if (!script.readyState || stateCheck.test(script.readyState)) {
				//				cleanUp(script);
				if (support.interactive) {
					deps = interactives[script.src] || [];
				}
				success(script, deps);
				script.parentNode.removeChild(script);
			}
		}
		if (script.attachEvent) {
			script.attachEvent(STR_ONREADYSTATECHANGE, callback)
		} else {
			script[STR_ONLOAD] = callback;
		}
			
			if (support.error) {
				script[STR_ONERROR] = error;
			}
			script.src = options.src;
			script.onSuccess = success;
		}
		
	head().insertBefore(script, head().firstChild);
	
	if (options.text) {
		success();
	}
});

steal.type("fn", function(options,original, success, error){
	success(options.fn());
});
steal.type("text", function(options, original, success, error){
	steal.request(options, function(text){
		options.text = text;
		success(text);
	}, error)
});

steal.type("css", function(options, original, success, error){
	if(options.text){
		var css  = document.createElement('style')
		if (css.styleSheet) { // IE
            css.styleSheet.cssText = options.text;
	    } else {
	        (function (node) {
	            if (css.childNodes.length > 0) {
	                if (css.firstChild.nodeValue !== node.nodeValue) {
	                    css.replaceChild(node, css.firstChild);
	                }
	            } else {
	                css.appendChild(node);
	            }
	        })(document.createTextNode(options.text));
	    }
		head().appendChild(css);
	} else {
		options = options || {};
		var link = doc[STR_CREATE_ELEMENT]('link');
		link.rel = options.rel || "stylesheet";
		link.href = options.src;
		link.type = 'text/css';
		head().appendChild(link);
	}
	
	success();
});

// Overwrite
(function(){
	if(opts.types){
		for(var type in opts.types){
			steal.type(type, opts.types[type]);
		}
	}
}());


// =============================== HELPERS ===============================
var factory = function() {
	return win.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
};


steal.request = function(options, success, error){
	var request = new factory(),
		contentType = (options.contentType || "application/x-www-form-urlencoded; charset=utf-8"),
		clean = function(){
			request = check = clean = null;
		},
		check = function(){
			if ( request.readyState === 4 )  {
				if ( request.status === 500 || request.status === 404 || 
				     request.status === 2 || 
					 (request.status === 0 && request.responseText === '') ) {
					error && error();
					clean();
				} else {
					success(request.responseText);
					clean();
				}
				return;
			} 
		};
		
	request.open("GET", options.src, options.async === false ? false : true);
	request.setRequestHeader('Content-type', contentType);
	if ( request.overrideMimeType ) {
		request.overrideMimeType(contentType);
	}
	
	request.onreadystatechange = function(){
	  check();                                                               
	}
	try {
		request.send(null);
	}
	catch (e) {
		console.error(e);
		setTimeout(function(){
			error && error();
			clean();
		}, 0)
	}
			 
};




	//  =============================== MAPPING ===============================
	var insertMapping = function(p){
		// don't worry about // rooted paths
		var mapName,
			map;
			
		// go through mappings
		for(var mapName in steal.mappings){
			map = steal.mappings[mapName]
			if(map.test.test(p)){ 
				return p.replace(mapName, map.path);
			}
		}
		return p;
	};
	File.prototype.mapJoin = function( url ){
		url = insertMapping(url);
		return File(url).joinFrom(this.path);
	};
	// modifies src
	steal.makeOptions = after(steal.makeOptions,function(raw){
		raw.src = steal.root.join(raw.rootSrc = insertMapping(raw.rootSrc));
	});
	
	//root mappings to other locations
	steal.mappings = {};
	/**
	 * Maps a 'rooted' folder to another location.
	 * @param {String|Object} from the location you want to map from.  For example:
	 *   'foo/bar'
	 * @param {String} [to] where you want to map this folder too.  Ex: 'http://foo.cdn/bar'
	 * @return {steal}
	 */
	steal.map = function(from, to){
		if(typeof from == "string"){
			steal.mappings[from] = {
				test : new RegExp("^("+from+")([/.]|$)"),
				path: to
			};
		} else { // its an object
			for(var key in from){
				steal.map(key, from[key]);
			}
		}
		return this;
	}
	
	// =============================== STARTUP ===============================
	
	
	var currentCollection;
	
	// essentially ... we need to know when we are on our first steal
	// then we need to know when the collection of those steals ends ...
	// and, it helps if we use a 'collection' steal because of it's natural 
	// use for going through the pending queue
	// 
	extend(steal,{
		before : function(){ },
		after: function(){
			if(! currentCollection ){
				currentCollection = new steal.p.init();
				// keep a reference in case it dissappears 
				
				var cur = currentCollection,
					go = function(){
					
						// let anyone listening to a start, start
						steal.trigger("start", cur);
						when(cur,"complete", function(){
							steal.trigger("end", cur);
						});
						cur.loaded();
					};
				// this needs to change for old way ....
				if(!win.setTimeout){
					go()
				}else{
					setTimeout(go,0)
				}
			}
		},
		_before : before,
		_after: after
	});
	
	// this can probably move above
	steal.p.complete = before(steal.p.complete, function(){
		if(this === currentCollection){ // this is the last steal
			currentCollection = null;
		}
	});
	
	
	
	// =============================== jQuery ===============================
	(function(){
		var jQueryIncremented = false,
			jQ,
			ready = false;
		
		// check if jQuery loaded after every script load ...
		steal.p.loaded = before(steal.p.loaded, function(){
	
	        var $ = typeof jQuery !== "undefined" ? jQuery : null;
	        if ($ && "readyWait" in $) {
	            
	            //Increment jQuery readyWait if ncecessary.
	            if (!jQueryIncremented) {
	                jQ = $;
					$.readyWait += 1;
	                jQueryIncremented = true;
	            }
	        }
		});
		
		// once the current batch is done, fire ready if it hasn't already been done
		steal.bind('end', function(){
			if (jQueryIncremented && !ready) {
				jQ.ready(true);
				ready = true;
	        }
		})

		
	})();
	
	// =============================== ERROR HANDLING ===============================
	steal.add = after(steal.add, function(stel){
		if(!support.error){
			stel.completeTimeout = setTimeout(function(){
				throw "steal.js : "+stel.path+" not completed"
			},5000);
		}
	});
	steal.p.complete = after(steal.p.complete, function(){
		this.completeTimeout && clearTimeout(this.completeTimeout)
	})
	
	
	// =============================== AOP ===============================
	function before(f, before, changeArgs){
		return changeArgs ? 
			function(){
				return f.apply(this,before.apply(this,arguments));
			}:
			function(){
				before.apply(this,arguments);
				return f.apply(this,arguments);
			}
	}
	function after(f, after, changeRet){
		
		return changeRet ?
			function(){
				return after.apply(this,[f.apply(this,arguments)].concat(makeArray(arguments)));
			}:
			function(){
				var ret = f.apply(this,arguments);
				after.apply(this,arguments);
				return ret;
			}
	}
	
	// converts a function to work with when
	function convert(ob, func){
			
		var oldFunc = ob[func];
		if(!ob[func].callbacks){
			//replace start with a function that will call ob2's method
			ob[func] = function(){
				var me = arguments.callee,
					ret;
				
				// call the original function
				ret = oldFunc.apply(ob,arguments)
				var cbs = me.callbacks,
					len = cbs.length;
				
				//mark as called so any callees added to this caller will
				//automatically get called
				me.called = true;
				// call other callbacks
				for(var i =0; i < len; i++){
					cbs[i].called()
				}
				return ret;
				
			}
			ob[func].callbacks = [];
		}

		return ob[func];
	};
	function join(obj, meth){
		this.obj = obj;
		this.meth = meth;
		convert(obj, meth)
		this.calls = 0
	}
	extend(join.prototype,{
		called : function(){
			this.calls--;
			this.go();
		},
		add : function(obj, meth){
			var f = convert(obj, meth)
			if(!f.called){
				f.callbacks.push(this);
				this.calls++;
			}
		},
		go : function(){
			if(this.calls === 0){
				this.obj[this.meth]()
			}
		}
	})
	// chains two functions.  When the first one is called,
	//   it calls the second function.
	//   If the second function has multiple callers, it waits until all have been called
	// 
	//   when(parent,"start", steal, "start")
	//
	function when(){
		// handle if we get called with a function
		var args = makeArray(arguments),
			last = args[args.length -1]
		if(typeof last === 'function' ){
			args[args.length -1] = {
				'fn' : last
			}
			args.push("fn");
		};
		
		var waitMeth = args.pop(), 
			waitObj = args.pop(),
			joined = new join(waitObj, waitMeth); 
		
		for(var i =0; i < args.length; i = i+2){
			joined.add(args[i], args[i+1])
		}
		
		// call right away if it should
		joined.go();
	}
	
	// =========== DEBUG =========
	var name = function(stel){
		if(stel.options && stel.options.type == "fn"){
			return stel.options.orig.toString().substr(0,50)
		}
		return stel.options ? stel.options.rootSrc : "CONTAINER"
	}
	
	/**steal.p.load = before(steal.p.load, function(){
		console.log("load", name(this), this.loading, this.id, pending)
	})
	
	steal.p.loaded = before(steal.p.loaded, function(){
		console.log("loaded", name(this), this.id, pending)
	})
	steal.p.complete = before(steal.p.complete, function(){
		console.log("complete", name(this), this.id, pending)
	})*/
	// ============= WINDOW LOAD ========
	var addEvent = function(elem, type, fn) {
		if ( elem.addEventListener ) {
			elem.addEventListener( type, fn, false );
		} else if ( elem.attachEvent ) {
			elem.attachEvent( "on" + type, fn );
		} else {
			fn();
		}
	};
	var loaded = {
		load : function(){},
		end : function(){}
	};
	
	firstEnd = false;
	addEvent(win, "load", function(){
		loaded.load();
	});
	steal.one("end", function(collection){
		loaded.end();
		firstEnd = collection;
	})
	when(loaded,"load",loaded,"end", function(){
		steal.trigger("ready")
	});
	
	steal.events.done = {
		add : function(cb){
			if(firstEnd){
				cb(firstEnd);
				return false;
			} else {
				return cb;
			}
		}
	};
	
	// =========== INTERACTIVE STUFF ===========
	

var interactiveScript, 
	// key is script name, value is array of pending items
	interactives = {},
	getInteractiveScript = function() {
	    var scripts, i, script;
	    if (interactiveScript && interactiveScript.readyState === 'interactive') {
	        return interactiveScript;
	    }
	
	    scripts = document.getElementsByTagName('script');
	    for (i = scripts.length - 1; i > -1 && (script = scripts[i]); i--) {
	        if (script.readyState === 'interactive') {
	            return script;
	        }
	    }
	
	    return null;
	}

if (support.interactive) {

	// after steal is called, check which script is "interactive" (for IE)
	steal.after = after(steal.after, function(){
		var interactive = getInteractiveScript();
		// if no interactive script, this is a steal coming from inside a steal, let complete handle it
		if (!interactive || !interactive.src || /steal\.js|production\.js/.test(interactive.src)) {
			return;
		}
		if (!interactives[interactive.src]) {
			interactives[interactive.src] = []
		}
		if (interactive.src) {
			interactives[interactive.src].push.apply(interactives[interactive.src], pending);
			pending = [];
			interactiveScript = interactive;
		}
	})
	
}
	
	// ===========  OPTIONS ==========
	
	var getStealScriptSrc = function(){
		if(!doc){
			return;
		}
		var scripts = doc[STR_GET_BY_TAG]("script"),
			stealReg = /steal\.(production\.)?js/,
			i = 0,
			len = scripts.length;

		
		//find the steal script and setup initial paths.
		for ( ; i < len; i++ ) {
			var src = scripts[i].src;
			if ( src && stealReg.test(src) ) { //if script has steal.js
				return scripts[i];
			}

		}
		return;
	};
	steal.getScriptOptions = function(script){
			var script = script || getStealScriptSrc(),
				src,
				scriptOptions,
				options = {},
				commaSplit;
				
			if(script){
				var src = script.src,
					start =  src.replace(/steal(\.production)?\.js.*/,"");
				if(/steal\/$/.test(start)){
					options.rootUrl = start.substr(0, start.length - 6);
				} else {
					options.rootUrl = start+"../"
				}
				if ( /steal\.production\.js/.test(src) ) {
					options.env = "production";
				}
				if ( src.indexOf('?') !== -1 ) {
					
					scriptOptions = src.split('?')[1];
					commaSplit = scriptOptions.split(",");
					
					if ( commaSplit[0] && commaSplit[0].lastIndexOf('.js') > 0 ) {
						options.startFile = commaSplit[0];
					} else if ( commaSplit[0] ) {
						options.app = commaSplit[0];
					}
					if ( commaSplit[1] && steal.options.env != "production" ) {
						options.env = commaSplit[1];
					}
					
				}
			
			}
			return options;
		};
	
	startup = after(startup, function(){
			extend(steal.options, steal.getScriptOptions());
			// a steal that existed before this steal
			if(typeof oldsteal == 'object'){
				extend(steal.options, oldsteal);
			}
			// CALCULATE CURRENT LOCATION OF THINGS ...
			steal.rootUrl(steal.options.rootUrl);
			
			// CLEAN UP OPTIONS
			if ( steal.options.app ) {
				steal.options.startFile = steal.options.app + "/" + steal.options.app.match(/[^\/]+$/)[0] + ".js";
			}

			//calculate production location;
			if (!steal.options.production && steal.options.startFile ) {
				steal.options.production = "//" + File(steal.options.startFile).dir() + '/production';
			}
			if ( steal.options.production ) {
				steal.options.production = steal.options.production + (steal.options.production.indexOf('.js') == -1 ? '.js' : '');
			}
			//we only load things with force = true
			if (steal.options.env == 'production' && steal.options.loadProduction) {
				if (steal.options.production) {
					//steal(steal.options.startFile);
					steal({
						src: steal.options.production,
						force: true
					});
				}
				
			}
			else {
				var steals = [];
				
				//if you have a startFile load it
				if (steal.options.startFile) {
					//steal(steal.options.startFile);
					steals.push("//"+steal.options.startFile)
				//steal._start = new steal.fn.init(steal.options.startFile);
				//steal.queue(steal._start);
				}
				if (steal.options.loadDev !== false) {
					steals.push({
						src: '//steal/dev/dev.js',
						ignore: true
					});
				}
				if (steals.length) {
					steal.apply(null, steals);
				}
			}
	});
	
	
	
	steal.when = when;
	// make steal public
	win.steal = steal;
	
	startup();
	
})()