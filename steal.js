(function( win, undefined ) {

	// the document ( might not exist in rhino )
	var doc = win.document,
		docEl = doc.documentElement,
		// a jQuery-like $.each
		each = function(o, cb) {
			var i, len;

			// weak array detection, but we only use this internally so don't
			// pass it weird stuff
			if ( o.pop ) {
				for ( i = 0, len = o.length; i <len; i++) {
					cb.call(o[i],i,o[i], o)
				}
			} else {
				for ( i in o ) {
					cb.call(o[i],i,o[i], o)
				}
			}
			return o;
		},
		isString = function( o ) {
			return typeof o == "string";
		},
		isFn = function( o ) {
			return typeof o == "function";
		},
		noop = function() {},
		// creates a script tag
		scriptTag = function() {
			var start = doc.createElement("script");
			start.type = "text/javascript";
			return start;
		},
		getElementsByTagName = function( tag ) {
			return doc.getElementsByTagName( tag );
		},
		// a function that returns the head element
		// creates and caches the lookup if necessary
		head = function() {
			var hd = getElementsByTagName("head")[0];
			if (! hd ) {
				hd = doc.createElement("head");
				docEl.insertBefore(hd, docEl.firstChild);
			}
			// replace head so it runs fast next time.
			head = function(){
				return hd;
			}
			return hd;
		},
		// extends one object with another
		extend = function( d, s ) {
			each(s, function( k ) {
				d[k] = s[k];
			});
			return d;
		},
		// makes an array of things, or a mapping of things
		map = function( args, cb ) {
			var arr = [];
			each(args, function(i, str){
				arr.push( cb ? ( isString( cb ) ? str[cb] : cb.call( str, str )) : str )
			});
			return arr;
		},
		// testing support for various browser behaviors
		support = {
			// does onerror work in script tags?
			error: doc && (function() {
				var script = scriptTag();
				script.onerror = noop;
				return isFn( script.onerror ) || "onerror" in script
			})(),
			// If scripts support interactive ready state.
			// This is set later.
			interactive: false,
			attachEvent : doc && scriptTag().attachEvent
		},
		// a startup function that will be called when steal is ready
		startup = noop,
		// the old steal value
		oldsteal = win.steal,
		// if oldsteal is an object
		// we use it as options to configure steal
		opts = typeof oldsteal == "object" ? oldsteal : {};
		
	// =============================== STEAL ===============================

	/**
	 * @class steal
	 * @parent stealjs
	 * 
	 * __steal__ is a function that loads scripts, css, and 
	 * other resources into your application.
	 * 
	 *     steal(FILE_or_FUNCTION, ...)
	 * 
	 * ## Quick Walkthrough
	 * 
	 * Add a script tag that loads <code>steal/steal.js</code> and add
	 * the path to the first file to load in the query string like:
	 * 
	 * &lt;script type='text/javascript'
	 *     src='../steal/steal.js?myapp/myapp.js'>
	 * &lt;/script>
	 * 
	 * Then, start loading things and using them like:
	 * 
	 *     steal('myapp/tabs.js',
	 *           'myapp/slider.js', 
	 *           'myapp/style.css',function(){
	 *     
	 *        // tabs and slider have loaded 
	 *        $('#tabs').tabs();
	 *        $('#slider').slider()
	 *     })
	 * 
	 * Make sure your widgets load their dependencies too:
	 * 
	 *     // myapp/tabs.js
	 *     steal('jquery', function(){
	 *       $.fn.tabs = function(){
	 *        ...
	 *       }
	 *     })
	 * 
	 * ## Examples:
	 * 
	 *     // Loads ROOT/jquery/controller/controller.js
	 *     steal('jquery/controller')
	 *     steal('jquery/controller/controller.js')
	 *     
	 *     // Loads coffee script type and a coffee file relative to
	 *     // the current file
	 *     steal('steal/coffee').then('./mycoffee.coffee')
	 *     
	 *     // Load 2 files and dependencies in parallel and
	 *     // callback when both have completed
	 *     steal('jquery/controller','jquery/model', function(){
	 *       // $.Controller and $.Model are available
	 *     })
	 *     
	 *     // Loads a coffee script with a non-standard extension (cf)
	 *     // relative to the current page and instructs the build
	 *     // system to not package it (but it will still be loaded).
	 *     steal({
	 *        src: "./foo.cf",
	 *        packaged: false,
	 *        type: "coffee"
	 *      })
	 * 
	 * The following is a longer walkthrough of how to install
	 * and use steal:
	 * 
	 * ## Adding steal to a page
	 * 
	 * After installing StealJS (or JavaScriptMVC), 
	 * find the <code>steal</code> folder with
	 * <code>steal/steal.js</code>. 
	 * 
	 * To use steal, add a script tag
	 * to <code>steal/steal.js</code> to your
	 * html pages.  
	 * 
	 * This walkthrough assumes you have the steal script 
	 * in <code>public/steal/steal.js</code> and a directory 
	 * structure like:
	 * 
	 * @codestart text
	 * /public
	 *     /steal
	 *     /pages
	 *         myapp.html
	 *     /myapp
	 *         myapp.js
	 *         jquery.js
	 *         jquery.ui.tabs.js
	 * @codeend
	 * 
	 * To use steal in <code>public/pages/myapp.html</code>,
	 * add a script tag in <code>myapp.html</code>:
	 * 
	 * @codestart html
	 * &lt;script type='text/javascript'
	 *     src='../steal/steal.js'>
	 * &lt;/script>
	 * @codeend
	 * 
	 * <div class='whisper'>PRO TIP: Bottom load your scripts. It
	 * will increase your application's percieved response time.</div>
	 * 
	 * ## Loading the First Script
	 * 
	 * Once steal has been added to your page, it's time
	 * to load scripts. We want to load <code>myapp.js</code>
	 * and have it load <code>jquery.js</code> and 
	 * <code>jquery.ui.tabs.js</code>.
	 * 
	 * By default, steal likes your scripts
	 * to be within in the [steal.static.root steal.root] folder.  The [steal.root] the 
	 * folder contains the <code>steal</code> folder.  In this example,
	 * it is the <code>public</code> folder.
	 * 
	 * To load <code>myapp/myapp.js</code>, we have two options:
	 * 
	 * #### Add a script tag
	 *  
	 * Add a script tag after the steal 
	 * script that 'steals' <code>myapp.js</code> like:
	 * 
	 * @codestart html
	 * &lt;script type='text/javascript'>
	 *   steal('myapp/myapp.js')
	 * &lt;/script>
	 * @codeend
	 * 
	 * #### Add the script parameter
	 * 
	 * The most common (and shortest) way to load <code>myapp.js</code>
	 * is to add the script path to the steal script's src after in the
	 * query params.  So, instead of adding a script, we change 
	 * the steal script from:
	 * 
	 * @codestart html
	 * &lt;script type='text/javascript'
	 *     src='../steal/steal.js'>
	 * &lt;/script>
	 * @codeend
	 * 
	 * To
	 * 
	 * @codestart html
	 * &lt;script type='text/javascript'
	 *     src='../steal/steal.js?<b>myapp/myapp.js</b>'>
	 * &lt;/script>
	 * @codeend
	 * 
	 * <div class='whisper'>PRO TIP: You can also just add
	 * <code>?myapp</code> to the query string.</div>
	 * 
	 * ## Loading Scripts
	 * 
	 * We want to load <code>jquery.js</code> and
	 * <code>jquery.ui.tabs.js</code> into the page and then
	 * add then create a tabs widget.  First we need to load 
	 * <code>jquery.js</code>.
	 * 
	 * By default, steal loads script relative to [steal.root]. To
	 * load <code>myapp/jquery.js</code> we can the following to
	 * <code>myapp.js</code>:
	 * 
	 *     steal('myapp/jquery.js');
	 *     
	 * But, we can also load relative to <code>myapp.js</code> like:
	 * 
	 *     steal('./jquery.js');
	 *     
	 * Next, we need to load <code>jquery.ui.tabs.js</code>.  You
	 * might expect something like:
	 * 
	 *     steal('./jquery.js','./jquery.ui.tabs.js')
	 * 
	 * to work.  But there are two problems / complications:
	 * 
	 *   - steal loads scripts in parallel and runs out of order
	 *   - <code>jquery.ui.tabs.js</code> depends on jQuery being loaded
	 *   
	 * This means that steal might load <code>jquery.ui.tabs.js</code>
	 * before <code>jquery.js</code>.  But this is easily fixed.
	 * 
	 * [steal.static.then] waits until all previous scripts have loaded and
	 * run before loading scripts after it.  We can load <code>jquery.ui.tabs.js</code>
	 * after <code>jquery.js</code> like:
	 * 
	 *     steal('./jquery.js').then('./jquery.ui.tabs.js')
	 * 
	 * Finally, we need to add tabs to the page after 
	 * the tabs's widget has loaded.  We can add a callback function to
	 * steal that will get called when all previous scripts have finished
	 * loading:
	 * 
	 *     steal('./jquery.js').then('./jquery.ui.tabs.js', function($){
	 *       $('#tabs').tabs();
	 *     })
	 *
	 * ## Other Info
	 * 
	 * ### Exclude Code Blocks From Production
	 *
	 * To exclude code blocks from being included in 
	 * production builds, add the following around
	 * the code blocks.
	 *
	 *     //@steal-remove-start
	 *         code to be removed at build
	 *     //@steal-remove-end
	 * 
	 * ### Lookup Paths
	 * 
	 * By default steal loads resources relative 
	 * to [steal.static.root steal.root].  For example, the following
	 * loads foo.js in <code>steal.root</code>:
	 * 
	 *     steal('foo.js'); // loads //foo.js
	 *     
	 * This is the same as writing:
	 * 
	 *     steal('//foo.js');
	 *     
	 * Steal uses <code>'//'</code> to designate the [steal.static.root steal.root]
	 * folder.
	 * 
	 * To load relative to the current file, add <code>"./"</code> or
	 *  <code>"../"</code>:
	 *  
	 *     steal("./bar.js","../folder/zed.js");
	 * 
	 * Often, scripts can be found in a folder within the same 
	 * name. For example, [jQuery.Controller $.Controller] is 
	 * in <code>//jquery/controller/controller.js</code>. For convience,
	 * if steal is provided a path without an extension like:
	 * 
	 *     steal('FOLDER/PLUGIN');
	 *     
	 * It is the same as writing:
	 * 
	 *     steal('FOLDER/PLUGIN/PLUGIN.js')
	 *     
	 * This means that <code>//jquery/controller/controller.js</code>
	 * can be loaded like:
	 * 
	 *      steal('jquery/controller')
	 * 
	 * ### Types
	 * 
	 * steal can load resources other than JavaScript.
	 * 
	 * 
	 * @constructor
	 * 
	 * Loads resources specified by each argument.  By default, resources
	 * are loaded in parallel and run in any order.
	 * 
	 * 
	 * @param {String|Function|Object} resource... 
	 * 
	 * Each argument specifies a resource.  Resources can 
	 * be given as a:
	 * 
	 * ### Object
	 *  
	 * An object that specifies the loading and build 
	 * behavior of a resource.  
	 *    
	 *      steal({
	 *        src: "myfile.cf",
	 *        type: "coffee",
	 *        packaged: true,
	 *        unique: true,
	 *        ignore: false,
	 *        waits: false
	 *      })
	 *    
	 * The available options are:
	 *    
	 *  - __src__ {*String*} - the path to the resource.  
	 *    
	 *  - __waits__ {*Boolean default=false*} - true the resource should wait 
	 *    for prior steals to load and run. False if the resource should load and run in
	 *    parallel.  This defaults to true for functions.
	 *  
	 *  - __unique__ {*Boolean default=true*} - true if this is a unique resource 
	 *    that 'owns' this url.  This is true for files, false for functions.
	 *             
	 *  - __ignore__ {*Boolean default=false*} - true if this resource should
	 *    not be built into a production file and not loaded in
	 *    production.  This is great for script that should only be available
	 *    in development mode.
	 *  
	 *  - __packaged__ {*Boolean default=true*} - true if the script should be built
	 *    into the production file. false if the script should not be built
	 *    into the production file, but still loaded.  This is useful for 
	 *    loading 'packages'.
	 * 
	 *  - __type__ {*String default="js"*} - the type of the resource.  This 
	 *    is typically inferred from the src.
	 * 
	 * ### __String__
	 *  
	 * Specifies src of the resource.  For example:
	 *  
	 *       steal('./file.js')
	 *         
	 * Is the same as calling:
	 *      
	 *       steal({src: './file.js'})
	 *  
	 * ### __Function__ 
	 *  
	 * A callback function that runs when all previous steals
	 * have completed.
	 *    
	 *     steal('jquery', 'foo',function(){
	 *       // jquery and foo have finished loading
	 *       // and running
	 *     })
	 * 
	 * @return {steal} the steal object for chaining
	 */
	function steal() {
		// convert arguments into an array
		var args = map(arguments);
		if ( args.length ) {
			pending.push.apply(pending,  args);
			// steal.after is called everytime steal is called
			// it kicks off loading these files
			steal.after(args);
			// return steal for chaining
		}
		return steal;
	};
	
	// =============================== Deferred .63 ============================ 
	
	var Deferred = function( func ) {
		if ( ! ( this instanceof Deferred ))
			return new Deferred();

		this.doneFuncs = [];
		this.failFuncs = [];
		this.resultArgs = null;
		this.status = "";

		// check for option function: call it with this as context and as first 
		// parameter, as specified in jQuery api
		func && func.call(this, this);
	}
	
	Deferred.when = function() {
		var args = map( arguments );
		if (args.length < 2) {
			var obj = args[0];
			if (obj && ( isFn( obj.isResolved ) && isFn( obj.isRejected ))) {
				return obj;			
			} else {
				return Deferred().resolve(obj);
			}
		} else {
			
			var df = Deferred(),
				done = 0,
				// resolve params: params of each resolve, we need to track down 
				// them to be able to pass them in the correct order if the master 
				// needs to be resolved
				rp = [];

			each(args, function(j, arg){
				arg.done(function() {
					rp[j] = (arguments.length < 2) ? arguments[0] : arguments;
					if (++done == args.length) {
						df.resolve.apply(df, rp);
					}
				}).fail(function() {
					df.reject(arguments);
				});
			});

			return df;
			
		}
	}
	
	var resolveFunc = function(type, status){
		return function(context){
			var args = this.resultArgs = (arguments.length > 1) ? arguments[1] : [];
			return this.exec(context, this[type], args, status);
		}
	},
	doneFunc = function(type, status){
		return function(){
			var self = this;
			each(arguments, function( i, v, args ) {
				if ( ! v )
					return;
				if ( v.constructor === Array ) {
					args.callee.apply(self, v)
				} else {
					// immediately call the function if the deferred has been resolved
					if (self.status === status)
						v.apply(this, this.resultArgs);
	
					self[type].push(v);
				}
			});
			return this;
		}
	};

	extend( Deferred.prototype, {

		resolveWith : resolveFunc("doneFuncs","rs"),
		rejectWith : resolveFunc("failFuncs","rj"),
		done : doneFunc("doneFuncs","rs"),
		fail : doneFunc("failFuncs","rj"),
		always : function() {
			var args = map(arguments);
			if (args.length > 0 && args[0])
				this.done(args[0]).fail(args[0]);

			return this;
		},

		then : function() {
			var args = map( arguments );
			// fail function(s)
			if (args.length > 1 && args[1])
				this.fail(args[1]);

			// done function(s)
			if (args.length > 0 && args[0])
				this.done(args[0]);

			return this;
		},

		isResolved : function() {
			return this.status === "rs";
		},

		isRejected : function() {
			return this.status === "rj";
		},

		reject : function() {
			return this.rejectWith(this, arguments);
		},

		resolve : function() {
			return this.resolveWith(this, arguments);
		},

		exec : function(context, dst, args, st) {
			if (this.status !== "")
				return this;

			this.status = st;

			each(dst, function(i, d){
				d.apply(context, args);
			});

			return this;
		}
	});

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
	var URI = function( url ) {
		if ( this.constructor !== URI ) {
			return new URI( url );
		}
		extend(this, URI.parse( "" + url ));
	};
	// the current url (relative to root, which is relative from page)
	// normalize joins from this 
	// 
	extend( URI, {
		// typically the path to steal's root folder
		// this is some folder you want things referenced from
		root : function(relativeURI){
			if ( relativeURI !== undefined) {
				root = URI(relativeURI);
				
				// the current folder-location of the page http://foo.com/bar/card
				var cleaned = URI.page,
					// the absolute location or root
					loc = cleaned.join(relativeURI);
				
				// cur now points to the 'root' location, but from the page
				URI.cur = loc.pathTo(cleaned) //cleaned.toReferenceFromSameDomain(loc);
				steal.root = root;
				return steal;
			} 
			return root;
		},
		parse : function(string) {
			var uriParts = string.split("?"),
				uri = uriParts.shift(),
				queryParts = uriParts.join("").split("#"),
				protoParts = uri.split("://"),
				parts = {
					query : queryParts.shift(),
					fragment : queryParts.join("#")
				},
				pathParts;

			if ( protoParts[1] ) {
				parts.protocol = protoParts.shift();
				pathParts = protoParts[0].split("/");
				parts.host = pathParts.shift();
				parts.path = "/" + pathParts.join("/");
			} else {
				parts.path = protoParts[0];
			}
			return parts;
		}
	});
	
	URI.page = URI( win.location && location.href );
	URI.cur = URI();

	/**
	 * @hide
	 * @prototype
	 */
	extend( URI.prototype, {
		dir : function(){
			var parts = this.path.split("/");
			parts.pop();
			return URI(this.domain() + parts.join("/"))
		},
		filename : function(){
			return this.path.split("/").pop();
		},
		ext : function(){
			var filename = this.filename();
			return ~ filename.indexOf(".") ? filename.split(".").pop() : "";
		},
		domain : function(){
			return this.protocol ? this.protocol+"://"+this.host : "";
		},
		// if we have a domain, and the uri does not share the domain, or we are 
		// on the filesystem 
		// returns if self is cross domain from uri
		isCrossDomain : function( uri ) {
			uri = URI( uri || win.location.href );
			var domain = this.domain(),
				uriDomain = uri.domain()
			return (domain && uriDomain && domain != uriDomain) || 
				this.protocol === "file" || 
				( domain && !uriDomain );
		},
		isRelativeToDomain : function(){
			return this.path.indexOf("/") == 0;
		},
		hash : function(){
			return this.fragment ? "#"+this.fragment : ""
		},
		search : function(){
			return this.query ? "?"+this.query : ""
		},
		join : function(uri, min){
			uri = URI(uri);
			if ( uri.isCrossDomain( this )) {
				return uri;
			}
			if ( uri.isRelativeToDomain() ) {
				return URI( this.domain() + uri )
			}
			// at this point we either 
			// - have the same domain
			// - this has a domain but uri does not
			// - both don't have domains
			var left = this.path ? this.path.split("/") : [],
				right = uri.path.split("/"),
				part = right[0];
			//if we are joining from a folder like cookbook/, remove the last empty part
			if ( this.path.match(/\/$/) ) {
				left.pop();
			}
			while ( part == ".." && left.length > 0 ) {
				// if we've emptied out, folders, just break
				// leaving any additional ../s
				if(! left.pop() ){ 
					break;
				}
				right.shift();
				
				part = right[0];
			}
			return URI( this.domain() + left.concat( right ).join("/") );
		},
		/**
		 * For a given path, a given working directory, and file location, update the 
		 * path so it points to a location relative to steal's root.
		 * 
		 * We want everything relative to steal's root so the same app can work in 
		 * multiple pages.
		 * 
		 * ./files/a.js = steals a.js
		 * ./files/a = a/a.js
		 * files/a = //files/a/a.js
		 * files/a.js = loads //files/a.js
		 */
		normalize : function() {
			var cur = URI.cur.dir(),
				path = this.path;
			if (path.indexOf("//") == 0) { //if path is rooted from steal's root (DEPRECATED) 
				path = URI(path.substr(2));
			} 
			else if (path.indexOf("./") == 0) { // should be relative
				path = cur.join(path.substr(2));
			}
			// only if we start with ./ or have a /foo should we join from cur
			else if (this.isRelative() ) {
				path = cur.join(path)
			}
			return path;
		},
		isRelative : function(){
			return  /^[\.|\/]/.test(this.path )
		},
		toString : function(){
			return this.domain()+this.path+this.search()+this.hash();
		},
		// a min path from 2 urls that share the same domain
		pathTo : function( uri ) {
			uri = URI(uri);
			var uriParts = uri.path.split("/"),
				thisParts = this.path.split("/"),
				result = [];
			while ( uriParts.length && thisParts.length && uriParts[0] == thisParts[0] ) {
				uriParts.shift();
				thisParts.shift();
			}
			each(thisParts, function(){ result.push("../") })
			return URI(result.join("") + uriParts.join("/"));
		},
		mapJoin : function( url ) {
			return this.join( insertMapping( url ));
		}
	});
	// temp add steal.File for backward compat
	steal.File = steal.URI = URI;
	// --- END URI
	
	var pending = [],
		s = steal,
		id = 0,
		steals = {},
		preloadElem = "MozAppearance" in docEl.style ? "object" : "img";


	/**
	 * @add steal
	 */
	// =============================== STATIC API ===============================
	var page;
	/**
	 *  @static
	 */
	extend(steal, {
		each : each,
		extend : extend,
		isRhino: win.load && win.readUrl && win.readFile,
		/**
		 * @attribute options
		 * Configurable options
		 */
		options : {
			env : "development",
			// TODO: document this
			loadProduction : true,
			needs : {
				less: "steal/less/less.js",
				coffee: "steal/coffee/coffee.js"
			}
		},
		/**
		 * @hide
		 * when a 'unique' steal gets added ...
		 * @param {Object} stel
		 */
		add : function(stel){
			steals[stel.rootSrc] = stel;
		},
		/**
		 * @hide
		 * Makes options
		 * @param {Object} options
		 */
		makeOptions : function(options){
			// convert it to a uri
			var src = options.src = URI(options.src),
				ext = src.ext();
			if ( ! ext ) {
				// if first character of path is a . or /, just load this file
				if ( src.isRelative() ) {
					src.path += ".js"
				}
				// else, load as a plugin
				else {
					src.path += "/" + src.filename() + ".js";
				}
			}
			
			var orig = src,
				// path relative to the current files path
				// this is done relative to jmvcroot
				normalized = URI(orig).normalize();
			
			extend(options, {
				originalSrc : orig,
				rootSrc : normalized,
				// path from the page
				src : URI.root().join( normalized )
			});
			options.originalSrc = options.src;
			
			return options;
		},
		/**
		 * Calls steal, but waits until all previous steals
		 * have completed loading until loading the 
		 * files passed to the arguments.
		 */
		then : function(){
			var args = map(arguments);
			return steal.apply( win, isFn( args[0] ) ?
					args : 
					[noop].concat( args ));
		},
		/**
		 * Listens to events on Steal
		 * @param {String} event
		 * @param {Function} listener
		 */
		bind: function( event, listener ) {
			if ( ! events[event] ) {
				events[event] = [] 
			}
			var special = steal.events[event]
			if ( special && special.add ) {
				listener = special.add( listener );
			}
			listener && events[event].push( listener );
			return steal;
		},
		one : function( event, listener ) {
			return steal.bind(event,function(){
				listener.apply(this, arguments);
				steal.unbind(event, arguments.callee);
			});
		},
		events : {},
		/**
		 * Unbinds an event listener on steal
		 * @param {Object} event
		 * @param {Object} listener
		 */
		unbind : function(event, listener){
			var evs = events[event] || [],
				i = 0;
			while ( i < evs.length ) {
				if(listener === evs[i]){
					evs.splice(i,1);
				} else {
					i++;
				}
			}
		},
		trigger : function(event, arg){
			var arr = events[event] || [];
			// array items might be removed during each iteration (with unbind), 
			// so we iterate over a copy
			each( map( arr ), function(i,f){
				f( arg );
			})
		},
		/**
		 * @hide
		 * Used to tell steal that it is loading a number of plugins
		 */
		loading : function() {
			// we don't use IE's interactive script functionality while 
			// production scripts are loading
			useInteractive = false;
			each(arguments, function(i, arg) {
				var stel = stealProto.make( arg );
				stel.loading = true;
			});
		},
		// called when a script has loaded via production
		loaded: function(name) {
			// create the steal, mark it as loading, then as loaded
			var stel = stealProto.make( name );
			stel.loading = true;
			//convert(stel, "complete");
			stel.executed()
			return steal;
		},
		// this is for methods on a 'steal instance'.  A file can be in one of a few states:
		// created - the steal instance is created, but we haven't started loading it yet
		//           this happens when thens are used
		// loading - (loading=true) By calling load, this will tell steal to load a file
		// loaded - (isLoaded=true) The file has been run, but its dependency files have been completed
		// complete - all of this files dependencies have loaded and completed.
		p : {
			init: function( options ) {
				this.dependencies = [];
				// id for debugging
				this.id = (++id);
				
				// if we have no options, we are the global init ... set ourselves up ...
				if ( ! options ) { //global init cur ...
					this.options = {};
					this.waits = false;
				} 
				//handle callback functions	
				else if ( isFn( options )) {
					var uri = URI.cur;
					
					this.options = {
						fn : function() {
						
							//set the path ..
							URI.cur = uri;
							
							// call the function, someday soon this will be requireJS-like
							options(steal.send || win.jQuery || steal); 
						},
						rootSrc: uri,
						orig: options,
						type: "fn"
					}
					// this has nothing to do with 'loading' options
					this.waits = true;
					this.unique = false;
				} else {

					// save the original options
					this.orig = options;

					this.options = steal.makeOptions( extend({},
						isString( options ) ? { src: options } : options ));

					this.waits = this.options.waits || false;
					this.unique = true;
				}

				this.loaded = Deferred();
				//this.executed = Deferred();
				this.completed = Deferred();
			}
		},
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
		type : function( type, cb ) {
			var typs = type.split(" ");
			
			if ( ! cb ) {
				return types[typs.shift()].require
			}
			
			types[typs.shift()] = {
				require : cb,
				convert: typs
			};
		},
		types : {}
	});


	// This is weird... but changing it breaks stuff
	var stealProto = steal.p.init.prototype = steal.p;

	extend(stealProto, {
		// adds a new steal and throws an error if the script doesn't load
		// this also checks the steals map
		make: function( options ) {
			
			var stel = new stealProto.init( options ),
				rootSrc = stel.options.rootSrc;
			
			if ( stel.unique && rootSrc ) {
				// the .js is b/c we are not adding that automatically until
				// load because we defer 'type' determination until then
				//
				// if we haven't loaded it before
				if ( ! steals[rootSrc] && ! steals[rootSrc + ".js"] ) {
					steals[rootSrc] = stel;
				} else{ // already have this steal
					stel = steals[rootSrc];
					// extend the old stolen file with any new options
					extend(stel.options, isString( options ) ? {} : options)
				}
			}
			
			return stel;
		},
		
		complete : function(){
			this.completed.resolve();
		},
		/**
		 * @hide
		 * After the script has been loaded and run
		 * 
		 *   - check what else has been stolen, load them
		 *   - mark yourself as complete when everything is completed
		 *   - this is where all the actions is
		 */

		executed: function( script ) {
			var myqueue, 
				stel, 
				src = ( script && script.src) || this.options.src,
				rootSrc = this.options.rootSrc;
			
			//set yourself as the current file 
			if ( this.options.rootSrc ) {
				URI.cur = URI( rootSrc );
			} //else {
				// you are the master, set yourself as the page
			//}
			// mark yourself as 'loaded'.  
			this.isLoaded = true;
			
			// If we are IE, get the queue from interactives
			// TODO move this out of this function
			if (support.interactive && src) {
				myqueue = interactives[src];
			}
			// is there a case in IE where, this makes sense?
			// in other browsers, the queue of items to load is
			// what is in pending
			if ( ! myqueue ) {
				myqueue = pending.slice(0);
				pending = [];
			}
			
			// if we have nothing, mark us as complete (resolve if deferred)
			if ( ! myqueue.length ) {
				this.complete();
				return;
			}
			
			// now we have to figure out how to wire up our pending steals
			var self = this,
				set = [],
				// the current
				joiner,  
				initial = [],
				isProduction = steal.options.env == "production",
				files = [],
				// a helper that basically does a join
				// when everything in arr's func method is called,
				// call func2 on obj
				//whenEach(files.concat(stel) , "complete", joiner, "execute");
				whenEach = function( arr, func, obj, func2 ) {
					var deferreds = map(arr, func)
					if(func2 === "execute"){
						deferreds.push(joiner.loaded)
					}
					return Deferred.when.apply(Deferred, deferreds).then(function(){
						if( isFn( obj[func2] )){
							obj[func2]()
						} else {
							obj[func2].resolve();
						}
						
					})
				},
				// a helper that does the oposite of a join.  When
				// obj's func method is called, call func2 on all items.
				// whenThe(stel,"completed", files ,"execute")
				whenThe = function( obj, func, items, func2 ) {
					if( func2 == "execute"){
						
						each(items, function(i, item){
							Deferred.when(obj[func], item.loaded).then(function() {
								item[func2]();
							})
						})
						
					}

					// TODO: Ask Justin what this branch is for.
					/** / else {
						obj[func].then(function(){
							each(items, function(i, item){
								item[func2]
							})
						})
					}
					/**/ 
					
					
				},
				stealInstances = [];

			// iterate through the collection and add all the 'needs' 
			// before fetching...
			each(myqueue.reverse(), function(i, item){
					
				if ( isProduction && item.ignore ) {
					return;
				}
					
				// make a steal object
				var stel = stealProto.make(item);
				
				// has to happen before 'needs' for when reversed...
				stealInstances.push(stel);
				each(stel.options.needs || [], function( i, raw ) {
					stealInstances.push( extend(stealProto.make(raw), {
						waits: true 
					}));
				});
			});
			
			each(stealInstances, function(i, stel){
				
				// add it as a dependency, circular are not allowed
				self.dependencies.unshift(stel);
				
				// start pre - loading everything right away
				stel.load();
				
				if ( stel.waits === false ) { // file
					// on the current 
					files.push(stel);
				
				} else { // function
					
					// essentially have to bind current files to call previous joiner's load
					// and to wait for current stel's complete
					
					if(!joiner){ // if no previous joiner, then we are at the end of a file
						
						// when they are complete, complete the file
						whenEach( files.concat(stel), "completed", self, "completed");
						
						// if there was a function then files, then end, function loads all files
						if(files.length){
							
							whenThe(stel,"completed", files ,"execute")
						}
						
					} else { //   function,  file1, file2, file3, joiner function
						
						whenEach(files.concat(stel) , "completed", joiner, "execute");
						
						// make stel complete load files
						whenThe(stel,"completed", files.length ? files : [joiner] ,"execute")
						
					}
					
					// the joiner is the previous thing
					joiner = stel;
					files = [];
				}
			});
			
			// now we should be left with the starting files
			if ( files.length ) {
				// we have initial files
				// if there is a joiner, we need to load it when the initial files 
				// are complete
				if(joiner){
					whenEach(files, "completed", joiner, "execute"); // problem
				} else {
					whenEach(files, "completed", self, "completed");
				}
				// reverse it back and load each initial file
				each(files.reverse(), function(i, f){
					f.loaded.then(function(){
						f.execute();
					});
				});
			} else if(joiner){
				// we have inital function
				joiner.loaded.then(function(){
					joiner.execute();
				})
			} else {
				// we had nothing
				self.complete();
			}

		},
		/**
		 * Loads this steal
		 */
		load: function(returnScript) {
			// if we are already loading / loaded
			if(this.loading || this.loaded.isResolved()){
				return;
			}
			
			this.loading = true;
			
			// get yourself
			var self = this;
			if ( this.options.type == "fn" || ! doc ) {
				self.loaded.resolve();
			} else {
				// do tricky pre-loading
				var el = doc.createElement( preloadElem ),
					done = false,
					onload = function() {
						if ( ! done && ( ! el.readyState || stateCheck.test( el.readyState ))) {
							done = true;

							self.loaded.resolve();
							if ( preloadElem == "object" ) {
								cleanUp( el );
							}
						}
					};

				el.src = el.data = self.options.src;
				el.onerror = el.onload = el.onreadystatechange = onload;

				if ( preloadElem == "object" ) {
					el.width = el.height = 0;
					head().insertBefore( el, head().firstChild );
				}
			}
		},
		execute : function(){
			var self = this;
			if ( ! self.executing ) {
				self.executing = true;
				steal.require( self.options, function( script ) {
					self.executed(script);
				}, function( error, src ) {
					win.clearTimeout && clearTimeout( self.completeTimeout )
					throw "steal.js : " + self.options.src + " not completed"
				});
			}
		}

	});
	
	
	var events = {};
	
	
	// =============================== TYPE SYSTEM ===============================
	
	var types = steal.types;
	
	
	
	// adds a type (js by default) and buildType (css, js)
	// this should happen right before loading
	// however, what if urls are different 
	// because one file has JS and another does not?
	// we could check if it matches something with .js because foo.less.js SHOULD
	// be rare
	stealProto.execute = before(stealProto.execute, function() {
		var raw = this.options;
		
		// if it's a string, get it's extension and check if
		// it is a registered type, if it is ... set the type
		if ( ! raw.type ) {
			var ext = URI( raw.src ).ext();
			if ( ! ext && ! types[ext] ) {
				ext = "js";
			}
			raw.type = ext;
		}
		if ( ! types[raw.type] ) {
			throw "steal.js - type " + raw.type + " has not been loaded.";
		}
		var converters =  types[raw.type].convert;
		raw.buildType = converters.length ? converters[converters.length - 1] : raw.type;
	});
	
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
		// get the type
		var type = types[options.type],
			converters;
		
		// if this has converters, make it get the text first, then pass it to the type
		if(type.convert.length){
			converters = type.convert.slice(0);
			converters.unshift("text", options.type)
		} else  {
			converters = [options.type]
		}
		require(options, converters, success, error)
	};

	function require(options, converters, success, error){
		
		var type = types[converters.shift()];
		
		type.require(options, function require_continue_check(){
			// if we have more types to convert
			if(converters.length){
				require(options, converters, success, error)
			} else { // otherwise this is the final
				success.apply(this, arguments);
			}
		}, error)
	};


// =============================== TYPES ===============================

// a clean up script that prevents memory leaks and removes the
// script
var cleanUp = function( elem ) {
		elem.onreadystatechange
			= elem.onload
			= elem.onerror
			= null;
			
		setTimeout(function() {
			head().removeChild( elem );
		}, 1);
	},
	// the last inserted script, needed for IE
	lastInserted,
	// if the state is done
	stateCheck = /^loade|c|u/;


var cssCount = 0,
	createSheet = doc && doc.createStyleSheet,
	lastSheet,
	lastSheetOptions;

// Apply all the types
each( extend( {
	"js" : function(options, success, error) {
		// create a script tag
		var script = scriptTag(),
			callback = function() {
				if ( ! script.readyState || stateCheck.test( script.readyState )) {
					cleanUp(script);
					success(script);
				}
			};
		// if we have text, just set and insert text
		if ( options.text ) {
			// insert
			script.text = options.text;
			
		} else {
			
			// listen to loaded
			script.onload = script.onreadystatechange = callback;
			
			// error handling doesn't work on firefox on the filesystem
			if (support.error && error && options.src.protocol !== "file") {
				script.onerror = error;
			}
			
			script.src = options.src;
			//script.async = false;
			script.onSuccess = success;
		}
			
		// insert the script
		lastInserted = script;
		head().insertBefore( script, head().firstChild );

		// if text, just call success right away, and clean up
		if (options.text) {
			callback();
		}
	},
	"fn" : function(options, success) {
		success(options.fn());
	},
	"text" : function(options, success, error){
		steal.request(options, function(text){
			options.text = text;
			success(text);
		}, error)
	},
	"css" : function(options, success, error) {
		if ( options.text ) { // less
			var css  = doc.createElement("style");
			css.type = "text/css";
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
				})(doc.createTextNode(options.text));
			}
			head().appendChild(css);
		} else {
			if ( createSheet ) {
				// IE has a 31 sheet and 31 import per sheet limit
				if(cssCount == 0){
					lastSheet = doc.createStyleSheet(options.src);
					lastSheetOptions = options;
					cssCount++;
				} else {
					var relative = "" + URI(lastSheetOptions.src).join(options.src);

					lastSheet.addImport( relative );
					cssCount++;
					if(cssCount == 30){
						cssCount = 0;
					}
				}
				success()
				return;
			}

			
			options = options || {};
			var link = doc.createElement("link");
			link.rel = options.rel || "stylesheet";
			link.href = options.src;
			link.type = "text/css";
			head().appendChild(link);
		}
		
		success();
	}
}, opts.types || {} ), steal.type );

// =============================== HELPERS ===============================
var factory = function() {
	return win.ActiveXObject ? 
		new ActiveXObject("Microsoft.XMLHTTP") : 
		new XMLHttpRequest();
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
		clean = function(){
			request = check = clean = null;
		},
		check = function(){
			var status = request.status;
			if ( request.readyState === 4 )  {
				if ( status === 500 || status === 404 || 
					 status === 2 || 
					 (status === 0 && request.responseText === "") ) {
					error && error();
				} else {
					success(request.responseText);
				}
				clean();
			} 
		};
	request.open("GET", options.src, ! ( options.async === false));
	request.setRequestHeader("Content-type", contentType);
	if ( request.overrideMimeType ) {
		request.overrideMimeType(contentType);
	}
	
	request.onreadystatechange = check;
	try {
		request.send(null);
	}
	catch (e) {
		console.error(e);
		error && error();
		clean();
	}
			 
};


	//  ============================== Packages ===============================

	/**
	 * Packages handles defining components for deferred downloading.
	 *
	 * This is a empty function used to prevent 'undefined' during
	 * development mode.  At production build time, the build script
	 * will read this for defining the packages.
	 * 
	 * 		steal.packages('tasks','dashboard','fileman');
	 * 
	 */
	var packs = [];
	steal.packages = function(){
		
		if(!arguments.length){
			return packs;
		} else {
			packs.push.apply(packs, arguments);
			return this;
		}
	};
	
	//  =============================== Extensions ==============================
	
	/**
	 * Modifies 'needs' property after 'makeOptions' to add
	 * necessary depedencies for the file extensions.
	 */
	steal.makeOptions = after(steal.makeOptions,function(raw){
		raw.ext = raw.src.ext();

		if(steal.options.needs[raw.ext]){
			if(!raw.needs){
				raw.needs = [];
			}
			
			raw.needs.push(steal.options.needs[raw.ext]);
		}
	});

	//  =============================== MAPPING ===============================
	var insertMapping = function(p){
		// go through mappings
		each(steal.mappings, function( key, value ) {
			if ( value.test.test( p )) { 
				return p.replace(key, value.path);
			}
		});
		return URI(p);
	};

	// =============================== STARTUP ===============================
	var rootSteal;
	
	// essentially ... we need to know when we are on our first steal
	// then we need to know when the collection of those steals ends ...
	// and, it helps if we use a 'collection' steal because of it's natural 
	// use for going through the pending queue
	// 
	extend(steal, {
		// modifies src
		makeOptions : after(steal.makeOptions,function(raw){
			raw.src = URI.root().join(raw.rootSrc = insertMapping(raw.rootSrc));
		}),

		//root mappings to other locations
		mappings : {},

		/**
		 * Maps a 'rooted' folder to another location.
		 * @param {String|Object} from the location you want to map from.  For example:
		 *   'foo/bar'
		 * @param {String} [to] where you want to map this folder too.  Ex: 'http://foo.cdn/bar'
		 * @return {steal}
		 */
		map : function(from, to){
			if ( isString( from )) {
				steal.mappings[from] = {
					test : new RegExp("^("+from+")([/.]|$)"),
					path: to
				};
			} else { // its an object
				each( form, steal.map );
			}
			return this;
		},


		// called after steals are added to the pending queue
		after: function(){
			// if we don't have a current 'top' steal
			// we create one and set it up
			// to start loading its dependencies (the current pending steals)
			if ( ! rootSteal ) {
				rootSteal = new stealProto.init();
				
				// keep a reference in case it disappears 
				var cur = rootSteal,
					// runs when a steal is starting
					go = function(){
						// indicates that a collection of steals has started
						steal.trigger("start", cur);
						cur.completed.then(function(){
							rootSteal = null;
							steal.trigger("end", cur);
							
						});
						cur.executed();
					};
				// if we are in rhino, start loading dependencies right away
				if ( win.setTimeout ) {
					// otherwise wait a small timeout to make 
					// sure we get all steals in the current file
					setTimeout( go, 0 )
				} else {
					go()
				}
			}
		},
		_before : before,
		_after: after
	});
	
	
	
	// =============================== jQuery ===============================
	(function(){
		var jQueryIncremented = false,
			jQ,
			ready = false;
		
		// check if jQuery loaded after every script load ...
		stealProto.loaded = before(stealProto.loaded, function() {
	
			var $ = jQuery;
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
		steal.bind("end", function(){
			if (jQueryIncremented && !ready) {
				jQ.ready(true);
				ready = true;
			}
		})

		
	})();
	
	// =============================== ERROR HANDLING ===============================
	extend( stealProto, {
		load : after(stealProto.load, function(stel){
			var self = this;
			if( doc && ! self.completed && ! self.completeTimeout && !steal.isRhino &&
				(self.options.src.protocol == "file" || !support.error)){
				self.completeTimeout = setTimeout(function(){
					throw "steal.js : "+self.options.src+" not completed"
				},5000);
			}
		}),
		complete : after(stealProto.complete, function(){
			this.completeTimeout && clearTimeout(this.completeTimeout)
		}),
		// =========== HAS ARRAY STUFF ============
		// Logic that deals with files that have collections of other files within 
		// them.  This is usually a production.css file, 
		// which when it loads, needs to mark several CSS and LESS files it represents 
		// as being "loaded".  This is done by the production.js file having 
		// steal({src: "production.css", has: ["file1.css", "file2.css"]  
		// 
		// after a steal is created, if its been loaded 
		// already and has a "has", mark those files as loaded
		make : after(stealProto.make, function(stel){
			// if we have things
			if( stel.options.has ) {
				// if we have loaded this already (and we are adding has's)
				if( stel.isLoaded ) {
					stel.loadHas();
				} else {
					// have to mark has as loading 
					steal.loading.apply(steal,stel.options.has)
				}
			}
			return stel;
		}, true),
	
		// if we're about to mark a file as loaded, mark its "has" array files as 
		// loaded also
		loaded : before(stealProto.loaded, function(){
			if(this.options.has){
				this.loadHas();
			}
		}),

		/**
		 * @hide
		 * Goes through the array of files listed in this.options.has, marks them all as loaded.  
		 * This is used for files like production.css, which, once they load, need to mark the files they 
		 * contain as loaded.
		 */
		loadHas : function(){
			var stel, i,
				current = URI.cur;
			
			// mark everything in has loaded
			each(this.options.has, function( i, has ) {
				// don't want the current file to change, since we're just marking files as loaded
				URI.cur = URI(current);
				stel = stealProto.make( has );
				// need to set up a "complete" callback for this file, so later waits know its already 
				// been completed
				convert(stel, "complete")
				stel.loaded();
			});
				
		}
	});
	
	
	// =============================== AOP ===============================
	function before(f, before, changeArgs){
		return changeArgs ? 
			function before_changeArgs(){
				return f.apply(this,before.apply(this,arguments));
			}:
			function before_args(){
				before.apply(this,arguments);
				return f.apply(this,arguments);
			}
	}
	/**
	 * Set up a function that runs after the first param. 
	 * @param {Object} f
	 * @param {Object} after
	 * @param {Object} changeRet If true, the result of the function will be passed to the after function as the first param.  If false, the after function's params are the 
	 * same as the original function's params
	 */
	function after(f, after, changeRet){
		
		return changeRet ?
			function after_CRet(){
				return after.apply(this,[f.apply(this,arguments)].concat(map(arguments)));
			}:
			function after_Ret(){
				var ret = f.apply(this,arguments);
				after.apply(this,arguments);
				return ret;
			}
	}

	
	
	// =========== DEBUG =========
	
	/** / 
	var name = function(stel){
		if(stel.options && stel.options.type == "fn"){
			return stel.options.orig.toString().substr(0,50)
		}
		return stel.options ? stel.options.rootSrc : "CONTAINER"
	}

	
	steal.p.load = before(steal.p.load, function(){
		console.log("load", name(this), this.loading, this.id)
	})
	
	steal.p.loaded = before(steal.p.loaded, function(){
		console.log("loaded", name(this), this.id)
	})
	steal.p.complete = before(steal.p.complete, function(){
		console.log("complete", name(this), this.id)
	})
	/**/

	// ============= WINDOW LOAD ========
	var addEvent = function(elem, type, fn) {
			if ( elem.addEventListener ) {
				elem.addEventListener( type, fn, false );
			} else if ( elem.attachEvent ) {
				elem.attachEvent( "on" + type, fn );
			} else {
				fn();
			}
		},
		loaded = {
			load : Deferred(),
			end : Deferred()
		},
		firstEnd = false;

	addEvent(win, "load", function(){
		loaded.load.resolve();
	});
	steal.one("end", function(collection){
		loaded.end.resolve();
		firstEnd = collection;
		steal.trigger("done", firstEnd)
	})
	Deferred.when(loaded.load, loaded.end).then(function(){
		steal.trigger("ready")
		steal.isReady = true;
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
	// Logic that deals with making steal work with IE.  IE executes scripts out of order, so in order to tell which scripts are 
	// dependencies of another, steal needs to check which is the currently "interactive" script.
	

var interactiveScript, 
	// key is script name, value is array of pending items
	interactives = {},
	getInteractiveScript = function(){
		var scripts = getElementsByTagName("script"),
			i = scripts.length;
		while ( i-- ) {
			if (scripts[i].readyState === "interactive") {
				return scripts[i];
			}
		}
	},
	getCachedInteractiveScript = function() {
		var script;
		if (interactiveScript && interactiveScript.readyState === "interactive") {
			return interactiveScript;
		}
		
		if(script = getInteractiveScript()){
			interactiveScript = script;
			return script;
		}
		
		// check last inserted
		if(lastInserted && lastInserted.readyState == "interactive"){
			return lastInserted;
		}
	
		return null;
	};
	
support.interactive = doc && !!getInteractiveScript();


if (support.interactive) {

	// after steal is called, check which script is "interactive" (for IE)
	steal.after = after(steal.after, function(){
		var interactive = getCachedInteractiveScript();
		// if no interactive script, this is a steal coming from inside a steal, let complete handle it
		if (!interactive || !interactive.src || /steal\.(production\.)*js/.test(interactive.src)) {
			return;
		}
		// get the source of the script
		var src = interactive.src;
		// create an array to hold all steal calls for this script
		if (!interactives[src]) {
			interactives[src] = []
		}
		// add to the list of steals for this script tag
		if (src) {
			interactives[src].push.apply(interactives[src], pending);
			pending = [];
		}
	})
	
	// This is used for packaged scripts.  As the packaged script executes, we grab the 
	// dependencies that have come so far and assign them to the loaded script
	steal.preloaded = before(steal.preloaded, function(stel){
		// get the src name
		var src = stel.options.src,
			// and the src of the current interactive script
			interactiveSrc = getCachedInteractiveScript().src;
		
		
		interactives[src] = interactives[interactiveSrc];
		interactives[interactiveSrc] = null;
	});
	
}
	
	// ===========  OPTIONS ==========
	
	var stealCheck  = /steal\.(production\.)?js.*/,
		getStealScriptSrc = function() {
			if ( ! doc ) {
				return;
			}
			var scripts = getElementsByTagName("script"),
				script;
			
			// find the steal script and setup initial paths.
			each( scripts, function( i, s ) {
				if ( stealCheck.test( s.src )) {
					script = s;
				}
			});
			return script;
		};

	steal.getScriptOptions = function( script ) {
		script = script || getStealScriptSrc();
		// lol options regex
		var matches = /(.+?)(steal\/)?steal\.(production\.)?js\??(.+)?(?:,(.+))?/.exec( script.src ),
			options = {};
		
		if ( script ) {
			options.rootUrl =  matches[2] ? 
				matches[1] : 
				matches[1] + "../";
			
			each({
				// Object literal's map to matches indexes
				3: "env", 
				4: "startFile", 
				5: "env"
			}, function( k, v ) {
				if ( matches[k] ) options[v] = matches[k];
			});
		}
		return options;
	};
	
	startup = after(startup, function(){
		var options = steal.options, 
			startFiles = [],
			startFile;
		extend(options, steal.getScriptOptions());
		// a steal that existed before this steal
		if ( typeof oldsteal == "object" ) {
			extend( options, oldsteal );
		}
		
		// if it looks like steal[xyz]=bar, add those to the options
		var search = win.location && decodeURIComponent(win.location.search);
		search && search.replace(/steal\[([^\]]+)\]=([^&]+)/g, function( whoe, prop, val ) {
			options[prop] = ~ val.indexOf(",") ? val.split(",") : val;
		});
		
		// CALCULATE CURRENT LOCATION OF THINGS ...
		URI.root( options.rootUrl );
		
		// CLEAN UP OPTIONS
		// make startFile have .js ending
		startFile = options.startFile;
		if ( startFile && startFile.indexOf(".") < 0 ) {
			options.startFile = startFile + "/" + startFile.split("/").pop() + ".js";
		}
		
		options.logLevel = options.logLevel || 0;

		//calculate production location;
		if (!options.production && options.startFile ) {
			options.production = URI(options.startFile).dir() + "/production.js";
		}
		if ( options.production && options.production.indexOf(".js") < 0 ) {
			options.production += ".js";
		}
		each(options.loaded || [], function(i, stel){
			steal.loaded(stel)
		})
		
		if ( isString( options.startFiles )) {
			startFiles.push( options.startFiles );
		} else if ( options.startFiles && options.startFiles.length ) {
			startFiles = options.startFiles;
		}

		var steals = [];
		// need to load startFiles in dev or production mode (to run funcunit in production)
		if ( startFiles.length ) {
			steal.options.startFiles = startFiles;
			steals.push.apply(steals, startFiles)
		}
		// either instrument is in this page (if we're the window opened from 
		// steal.browser), or its opener has it
		
		// try-catching this so we dont have to build up to the iframe
		// instrumentation check
		try {
			if ( options.instrument || ( ! options.browser && win.top.opener.steal.options.instrument )) {
				// force startFiles to load before instrument
				steals.push(noop, {
					src: "steal/instrument",
					waits: true
				});
			}
		} catch (e){}
		
		// we only load things with force = true
		if ( options.env == "production" && options.loadProduction && options.production ) {
			steal({
				src: options.production,
				force: true
			});
		} else {
			if (options.loadDev !== false) {
				steals.unshift({
					src: "steal/dev/dev.js",
					ignore: true
				});
			}
			
			if (options.startFile) {
				steals.push(options.startFile)
			}
		}
		if (steals.length) {
			steal.apply(win, steals);
		}
	});
	

	
	
	
	//steal.when = when;
	// make steal public
	win.steal = steal;
	
	startup();
	
})( this )
