(function( win, undefined ) {

	// the document ( might not exist in rhino )
	var doc = win.document,
		docEl = doc && doc.documentElement,
		// a jQuery-like $.each
		each = function(o, cb) {
			var i, len;

			// weak array detection, but we only use this internally so don't
			// pass it weird stuff
			if ( typeof o.length == 'number' ) {
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
		createElement = function(nodeName){
			return doc.createElement(nodeName)
		},
		// creates a script tag
		scriptTag = function() {
			var start = createElement("script");
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
				hd = createElement("head");
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
			// only extend if we have something to extend
			s && each(s, function( k ) {
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
		// if oldsteal is an object
		// we use it as options to configure steal
		opts = typeof win.steal == "object" ? win.steal : {},
		// adds a suffix to the url for cache busting
		addSuffix = function(str){
			if(opts.suffix){
				str = (str + '').indexOf('?') > -1 ?
						str + "&" + opts.suffix :
						str + "?" + opts.suffix;
			}
			return str;
		};

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
	 *     //!steal-remove-start
	 *         code to be removed at build
	 *     //!steal-remove-end
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
	 *    in development mode.  This script is loaded during compression, but not
	 *    added to the bundled script.
	 *
	 *  - __packaged__ {*Boolean default=true*} - true if the script should be built
	 *    into the production file. false if the script should not be built
	 *    into the production file, but still loaded.  This is useful for
	 *    loading 'packages'.  This script is loaded during compression, but not
	 *    added to the bundled script.  The difference with ignore is packaged still
	 *    steals this file while production mode, from an external script.
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
						v.apply(this, this.resultArgs || []);

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
			if (args.length && args[0])
				this.done(args[0]).fail(args[0]);

			return this;
		},

		then : function() {
			var args = map( arguments );
			// fail function(s)
			if (args.length > 1 && args[1])
				this.fail(args[1]);

			// done function(s)
			if (args.length && args[0])
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
	// HELPER METHODS FOR DEFERREDS

	// Used to call a method on an object or resolve a
	// deferred on it when a group of deferreds is resolved.
	//
	//     whenEach(resources,"complete",resource,"execute")
	var whenEach = function( arr, func, obj, func2 ) {
		var deferreds = map(arr, func)
		return Deferred.when.apply(Deferred, deferreds).then(function(){
			if( isFn( obj[func2] )){
				obj[func2]()
			} else {
				obj[func2].resolve();
			}

		})
	},
	// Used to call methods on multiple objects when
	// a single deferred is resolved:
	//
	//     whenThe(resource,"complete",resources,"load")
	//
	// TODO: this might be no longer used
	whenThe = function( obj, func, items, func2 ) {

			each(items, function(i, item){
				Deferred.when(obj[func]).then(function() {
					item[func2]();
				})
			})

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
	var URI = function( url ) {
		if ( this.constructor !== URI ) {
			return new URI( url );
		}
		extend(this, URI.parse( "" + url ));
	}, root;
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
			return root || URI("");
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
			return !this.path.indexOf("/");
		},
		hash : function(){
			return this.fragment ? "#"+this.fragment : ""
		},
		search : function(){
			return this.query ? "?"+this.query : ""
		},
		// like join, but returns a string
		add : function(uri){
			return this.join(uri)+'';
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
			while ( part == ".." && left.length) {
				// if we've emptied out, folders, just break
				// leaving any additional ../s
				if(! left.pop() ){
					break;
				}
				right.shift();

				part = right[0];
			}
			return extend( URI( this.domain() + left.concat( right ).join("/") ), {
				query: uri.query
			});
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
			//if path is rooted from steal's root (DEPRECATED)
			if (!path.indexOf("//")) {
				path = URI(path.substr(2));
			} else if (!path.indexOf("./")) { // should be relative
				path = cur.join( path.substr(2) );
			}
			// only if we start with ./ or have a /foo should we join from cur
			else if (this.isRelative() ) {
				path = cur.join(this.domain() + path)
			}
			path.query = this.query;
			return path;
		},
		isRelative : function(){
			return  /^[\.|\/]/.test(this.path )
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
			return this.join( URI( url ).insertMapping() );
		},
		// helper to go from jquery to jquery/jquery.js
		addJS : function(){
			var ext = this.ext();
			if ( ! ext ) {
				// if first character of path is a . or /, just load this file
				if ( ! this.isRelative() ) {
					this.path += "/" + this.filename();
				}
				this.path += ".js"
			}
			return this;
		}
	});

	// This can't be added to the prototype using extend because
	// then for some reason IE < 9 won't recognize it.
	URI.prototype.toString = function(){
		return this.domain()+this.path+this.search()+this.hash();
	};

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
	/**
	 *  @static
	 */
	extend(steal, {
		each : each,
		extend : extend,
		Deferred : Deferred,
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
			},
			logLevel : 0
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
			var src = options.src = URI(options.src);
			if (!options.type) {
				src = options.src = src.addJS();
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
			if(typeof args[0] === "string"){
				args[0] = {src : args[0]}
			}
			if(typeof args[0] === "object"){
				args[0].waits = true;
			}
			return steal.apply( win, args);
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
		has: function() {
			// we don't use IE's interactive script functionality while
			// production scripts are loading
			support.interactive = false;
			each(arguments, function(i, arg) {
				var stel = Resource.make( arg );
				stel.loading = stel.executing = true;
			});
		},

		// a dummy function to add things to after the stel is created, but before executed is called
		preexecuted : function(){},

		// called when a script has loaded via production
		executed: function(name) {
			// create the steal, mark it as loading, then as loaded
			var stel = Resource.make( name );
			stel.loading = stel.executing = true;
			//convert(stel, "complete");

			steal.preexecuted(stel);
			stel.executed()
			return steal;
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
	// ============ RESOURCE ================

	// a map of resources by resourceID
	var resources = {};
	// this is for methods on a 'steal instance'.  A file can be in one of a few states:
	// created - the steal instance is created, but we haven't started loading it yet
	//           this happens when thens are used
	// loading - (loading=true) By calling load, this will tell steal to load a file
	// loaded - (isLoaded=true) The file has been run, but its dependency files have been completed
	// complete - all of this files dependencies have loaded and completed.


	// A Resource is almost anything. It is different from a module
	// as it doesn't represent some unit of functionality, rather
	// it represents a unit that can have other units "within" it
	// as dependencies.  A resource can:
	//
	// - load - load the resource to the client so it is available, but don't run it yet
	// - run - run the code for the resource
	// - executed - the code has been run for the resource, but all
	//   dependencies for that resource might not have finished
	// - completed - all resources within the resource have completed
	//
	// __options__
	// `options` can be a string, function, or object.
	//
	// __properties__
	//
	// - options - has a number of properties
	//    - src - a URI to this resource that can be loaded from the current page
	//    - rootSrc - a URI to this resource relative to the current root URI.
	//    - type - the type of resource: "fn", "js", "css", etc
	//    - needs - other resources that must be loaded prior to this resource
	//    - fn - a callback function to run when executed
	// - unique - false if this resource should be loaded each time
	// - waits - this resource should wait until all prior scripts have completed before running
	// - loaded - a deferred indicating if this resource has been loaded to the client
	// - run - a deferred indicating if the the code for this resource run
	// - completed - a deferred indicating if all of this resources dependencies have
	//   completed
	// - dependencies - an array of dependencies
	var Resource = function( options ) {
		// an array for dependencies, this is
		this.dependencies = [];
		// id for debugging
		this.id = (++id);

		// if we have no options, we are the global Resource that
		// contains all other resources.
		if ( ! options ) { //global init cur ...
			this.options = {};
			this.waits = false;
		}
		//handle callback functions
		else if ( isFn( options )) {
			var uri = URI.cur;

			this.options = {
				fn : function() {

					// Set the URI if there are steals
					// within the callback.
					URI.cur = uri;

					// call the function, someday soon this will be requireJS-like
					return options(steal.send || win.jQuery || steal);
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
		// create the deferreds used to manage state
		this.loaded = Deferred();
		this.run = Deferred();
		this.completed = Deferred();
	};
	// `Resource.make` is used to either create
	// a new resource, or return an existing
	// resource that matches the options.
	Resource.make = function( options ) {
		// create the temporary reasource
		var resource = new Resource( options ),
			// use `rootSrc` as the definitive ID
			rootSrc = resource.options.rootSrc;

		// assuming this resource should not be created again.
		if ( resource.unique && rootSrc ) {

			// Check if we already have a resource for this rootSrc
			// Also check with a .js ending because we defer 'type'
			// determination until later
			if ( ! resources[rootSrc] && ! resources[rootSrc + ".js"] ) {
				// If we haven't loaded, cache the resource
				resources[rootSrc] = resource;
			} else {
				// Otherwise get the cached resource
				resource = resources[rootSrc];
				// If options were passed, copy new properties over.
				// Don't copy src, etc because those have already
				// been changed to be the right values;
				if(!isString( options )){
					each(["src","rootSrc","originalSrc"], function(i, name){
						delete options[name];
					});
					extend(resource.options, options);
				}

			}
		}

		return resource;
	};

	extend(Resource.prototype, {
		// Calling complete indicates that all dependencies have
		// been completed for this resource
		complete : function(){
			this.completed.resolve();
		},
		// After the script has been loaded and run
		// - checks what has been stolen (in pending)
		// - wires up pendings steal's deferreds to eventually complete this
		// - this is where all of steal's complexity is
		executed: function( script ) {
			var myqueue,
				stel,
				src = ( script && script.src) || this.options.src,
				rootSrc = this.options.rootSrc;

			// Set this as the current file so any relative urls
			// will load from it.
			if ( this.options.rootSrc ) {
				URI.cur = URI( rootSrc );
			}
			// mark yourself as 'loaded'.
			this.run.resolve();

			// If we are IE, get the queue from interactives.
			// It in interactives because you can't use onload to know
			// which script is executing.
			if (support.interactive && src) {
				myqueue = interactives[src];
			}
			// In other browsers, the queue of items to load is
			// what is in pending
			if ( ! myqueue ) {
				myqueue = pending.slice(0);
				pending = [];
			}

			// if we have nothing, mark us as complete
			if ( ! myqueue.length ) {
				this.complete();
				return;
			}

			// now we have to figure out how to wire up our pending steals
			var self = this,
				// the current
				isProduction = steal.options.env == "production",

				stealInstances = [];

			// iterate through the collection and add all the 'needs'
			// before fetching...
			each(myqueue.reverse(), function(i, item){

				if ( isProduction && item.ignore ) {
					return;
				}
				// make a steal object
				var stel = Resource.make(item);
				if(packHash[stel.options.rootSrc] && stel.options.type !== 'fn'){ // if we are production, and this is a package, mark as loading, but steal package?
					steal.has(stel.options.rootSrc);
					stel = Resource.make(packHash[stel.options.rootSrc]);
				}
				// has to happen before 'needs' for when reversed...
				stealInstances.push(stel);
				each(stel.options.needs || [], function( i, raw ) {
					//TODO: Justin take a look at this ... this is a bad fix!!
					stealInstances.push( Resource.make(function(){}), Resource.make(raw) ) ;
				});
			});

			// The set of resources before the previous "wait" resource
			var priorSet = [],
				// The current set of resources after and including the
				// previous "wait" resource
				set = [],
				// The first set of resources that we will execute
				// right away
				firstSet = [],
				// Should we be adding resources to the
				// firstSet
				setFirstSet = true;

			// Goes through each resource and maintains
			// a list of the set of resources
			// that must be complete before the current
			// resource (`priorSet`).
			each(stealInstances.reverse(), function(i, stel){

				// add it as a dependency, circular are not allowed
				self.dependencies.unshift(stel);
				// console.log('adding deps', self.dependencies.length, self, stel)

				// if there's a wait and it's not the first thing
				if(stel.waits && set.length){
					// add the current set to `priorSet`
					priorSet = priorSet.concat(set);
					// empty the current set
					set = [];
					// we have our firs set of items
					setFirstSet = false;
				}
				// when the priorSet is completed, execute this resource
				whenEach(priorSet, "completed", stel, "execute");

				stel.waitedOn = stel.waitedOn ? stel.waitedOn.concat(priorSet) : priorSet.slice(0);

				// add this steal to the current set
				set.push(stel);
				if(setFirstSet){
					// add this to the first set of things
					firstSet.push(stel)
				}
				// start loading the resource if possible
				stel.load();
			});

			// when every thing is complete, mark us as completed
			priorSet = priorSet.concat(set);
			whenEach(priorSet, "completed", self, "completed");

			// execute the first set of dependencies
			each(firstSet, function(i, f){
				f.execute();
			});

		},
		/**
		 * Loads this steal
		 */
		load: function(returnScript) {
			// if we are already loading / loaded
			if ( this.loading || this.loaded.isResolved() ) {
				return;
			}

			this.loading = true;
			this.loaded.resolve();
		},
		execute: function(){
			var self = this;
			if ( ! self.loaded.isResolved() ) {
				self.loaded.resolve();
			}
			if ( ! self.executing ) {
				self.executing = true;
				//console.log("GETTING", self.options.src+"")
				steal.require( self.options, function( script ) {
					self.executed(script);
				}, function( error, src ) {
					var abortFlag = self.options.abort,
						errorCb = self.options.error;

					// if an error callback was provided, fire it
					if(errorCb){
						errorCb.call(self.options);
					}

					win.clearTimeout && win.clearTimeout(self.completeTimeout)

					// if abort: false, register the script as loaded, and don't throw
					if(abortFlag === false){
						self.executed();
						return;
					}
					throw "steal.js : "+self.options.src+" not completed"
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
	Resource.prototype.execute = before(Resource.prototype.execute, function() {
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
		if ( ! types[raw.type] && steal.options.env == 'development' ) {
			throw "steal.js - type " + raw.type + " has not been loaded.";
		} else if ( ! types[raw.type] && steal.options.env == 'production' ) {
			// if we haven't defined EJS yet and we're in production, its ok, just ignore it
			return;
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

			script.src = options.src = addSuffix(options.src);

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
		var ret;
	    if(!options.skipCallbacks){
			ret = options.fn();
		}
		success(ret);
	},
	"text" : function(options, success, error){
		steal.request(options, function(text){
			options.text = text;
			success(text);
		}, error)
	},
	"css" : function(options, success, error) {
		if ( options.text ) { // less
			var css  = createElement("style");
			css.type = "text/css";
			if (css.styleSheet) { // IE
				css.styleSheet.cssText = options.text;
			} else {
				(function (node) {
					if (css.childNodes.length) {
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
				if(!cssCount++){
					lastSheet = doc.createStyleSheet( addSuffix(options.src) );
					lastSheetOptions = options;
				} else {
					var relative = "" + URI(URI(lastSheetOptions.src).dir()).pathTo(options.src);
					lastSheet.addImport( addSuffix(relative) );
					if(cssCount == 30){
						cssCount = 0;
					}
				}
				success();
				return;
			}

			options = options || {};
			var link = createElement("link");
			link.rel = options.rel || "stylesheet";
			link.href = addSuffix(options.src);
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
			var status;
			if ( request && request.readyState === 4 )  {
				status = request.status;
				if ( status === 500 || status === 404 ||
					 status === 2 || request.status < 0 ||
					 (!status && request.responseText === "") ) {
					error && error(request.status);
				} else {
					success(request.responseText);
				}
				clean();
			}
		};
	request.open("GET", options.src+'', ! ( options.async === false));
	request.setRequestHeader("Content-type", contentType);
	if ( request.overrideMimeType ) {
		request.overrideMimeType(contentType);
	}

	request.onreadystatechange = check;
	try {
		request.send(null);
	}
	catch (e) {
		if (clean) {
			console.error(e);
			error && error();
			clean();
		}
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
	var packs = [],
		packHash = {};
	steal.packages = function(map){

		if(!arguments.length){
			return packs;
		} else {
			if(typeof map == 'string'){
				packs.push.apply(packs, arguments);
			} else {
				packHash = map;
			}

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
	URI.prototype.insertMapping = function(){
		// go through mappings
		var orig = "" + this,
			key, value;
		for ( key in steal.mappings ) {
			value = steal.mappings[key]
			if ( value.test.test( orig )) {
				return orig.replace(key, value.path);
			}
		}
		return URI( orig );
	};

	// =============================== STARTUP ===============================
	var rootSteal = false;

	// essentially ... we need to know when we are on our first steal
	// then we need to know when the collection of those steals ends ...
	// and, it helps if we use a 'collection' steal because of it's natural
	// use for going through the pending queue
	//
	extend(steal, {
		// modifies src
		makeOptions : after(steal.makeOptions,function(raw){
			raw.src = URI.root().join(raw.rootSrc = URI( raw.rootSrc ).insertMapping());
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
		map: function(from, to){
			if ( isString( from )) {
				steal.mappings[from] = {
					test : new RegExp("^(\/?"+from+")([/.]|$)"),
					path: to
				};
			} else { // its an object
				each( from, steal.map );
			}
			return this;
		},


		// called after steals are added to the pending queue
		after: function(){
			// if we don't have a current 'top' steal
			// we create one and set it up
			// to start loading its dependencies (the current pending steals)
			if ( ! rootSteal ) {
				rootSteal = new Resource();

				// keep a reference in case it disappears
				var cur = rootSteal,
					// runs when a steal is starting
					go = function(){

						// indicates that a collection of steals has started
						// console.log('start', cur)
						steal.trigger("start", cur);
						cur.completed.then(function(){

							rootSteal = null;
							steal.trigger("end", cur);
							// console.log("end", cur)

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
		Resource.prototype.executed = before(Resource.prototype.executed, function() {

			var $ = win.jQuery;
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

	extend( Resource.prototype, {
		load : after(Resource.prototype.load, function(stel){
			var self = this;
			if( doc && ! self.completed && ! self.completeTimeout && !steal.isRhino &&
				(self.options.src.protocol == "file" || !support.error)){
				self.completeTimeout = setTimeout(function(){
					throw "steal.js : "+self.options.src+" not completed"
				},5000);
			}
		}),
		complete : after(Resource.prototype.complete, function(){
			this.completeTimeout && clearTimeout(this.completeTimeout)
		}),


		// if we're about to mark a file as executed, mark its "has" array files as
		// executed also
		executed : before(Resource.prototype.executed, function(){
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

			if(this.options.buildType == 'js'){
				return;
			}

			// mark everything in has loaded
			each(this.options.has, function( i, has ) {
				// don't want the current file to change, since we're just marking files as loaded
				URI.cur = URI(current);
				steal.executed(has);
			});

		}
	});

	// =========== HAS ARRAY STUFF ============
	// Logic that deals with files that have collections of other files within
	// them.  This is usually a production.css file,
	// which when it loads, needs to mark several CSS and LESS files it represents
	// as being "loaded".  This is done by the production.js file having
	// steal({src: "production.css", has: ["file1.css", "file2.css"]
	//
	// after a steal is created, if its been loaded
	// already and has a "has", mark those files as loaded
	Resource.make = after(Resource.make, function(stel){
		// if we have things
		if( stel.options.has ) {
			// if we have loaded this already (and we are adding has's)
			if( stel.run.isResolved() ) {
				stel.loadHas();
			} else {
				// have to mark has as loading (so we don't try to get them)
				steal.has.apply(steal,stel.options.has)
			}
		}
		return stel;
	}, true);
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



	/*var name = function(stel){
		if(stel.options && stel.options.type == "fn"){
			return stel.options.orig.toString().substr(0,50)
		}
		return stel.options ? stel.options.rootSrc + "": "CONTAINER"
	}


	steal.p.load = before(steal.p.load, function(){
		console.log("load", name(this), this.loading, this.id)
	})

	steal.p.executed = before(steal.p.executed, function(){
		console.log("executed", name(this), this.id)
	})
	steal.p.complete = before(steal.p.complete, function(){
		console.log("complete", name(this), this.id)
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
		// console.log("firstEnd", firstEnd);
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
			if (interactiveScript && interactiveScript.readyState === 'interactive') {
				return interactiveScript;
			}
			
			if(interactiveScript = getInteractiveScript()){
				return interactiveScript;
			}
			
			// check last inserted
			if(lastInserted && lastInserted.readyState == 'interactive'){
				return lastInserted;
			}
		
			return null;
		};


support.interactive = doc && !!getInteractiveScript();

if (support.interactive) {

	// after steal is called, check which script is "interactive" (for IE)
	steal.after = after(steal.after, function(){
		
		// check if disabled by steal.loading()
		if (!support.interactive) {
			return;
		}
			
		var interactive = getCachedInteractiveScript();
		// if no interactive script, this is a steal coming from inside a steal, let complete handle it
		if (!interactive || !interactive.src || /steal\.(production|production\.[a-zA-Z0-9\-\.\_]*)*js/.test(interactive.src)) {
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
	steal.preexecuted = before(steal.preexecuted, function(stel){
		// check if disabled by steal.loading()
		if (!support.interactive) {
			return;
		}
		
		// get the src name
		var src = stel.options.src,
			// and the src of the current interactive script
			interactiveSrc = getCachedInteractiveScript().src;

		interactives[src] = interactives[interactiveSrc];
		interactives[interactiveSrc] = null;

	})
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
      if ( parts[ parts.length - 1 ] == "steal" ) {
        parts.pop();
      }
      options.rootUrl = parts.join("/")

		}

		return options;
	};

	startup = after(startup, function(){
		var options = steal.options;

		// A: GET OPTIONS

		// 1. get script options
		extend(options, steal.getScriptOptions());

		// 2. options from a steal object that existed before this steal
		extend( options, opts );

		// 3. if url looks like steal[xyz]=bar, add those to the options
		// does this ened to be supported anywhere?
		var search = win.location && decodeURIComponent(win.location.search);
		search && search.replace(/steal\[([^\]]+)\]=([^&]+)/g, function( whoe, prop, val ) {
			options[prop] = ~ val.indexOf(",") ? val.split(",") : val;
		});

		// B: DO THINGS WITH OPTIONS

		// CALCULATE CURRENT LOCATION OF THINGS ...
		URI.root( options.rootUrl );

		// make sure startFile and production look right
		if ( options.startFile ) {
			options.startFile = "" +  URI( options.startFile ).addJS()
			if(!options.production){
				options.production = URI(options.startFile).dir() + "/production.js";
			}
		}

		// mark things that have already been loaded
		each(options.executed || [], function(i, stel){
			steal.executed(stel)
		})
		// immediate steals we do
		var steals = [];

		// add start files first
		if(options.startFiles){
			/// this can be a string or an array
			steals.push.apply(steals, isString( options.startFiles ) ?
				[options.startFiles] : options.startFiles)
			options.startFiles = steals.slice(0)
		}

		// either instrument is in this page (if we're the window opened from
		// steal.browser), or its opener has it

		// try-catching this so we dont have to build up to the iframe
		// instrumentation check

		try {
			if ( options.instrument || ( ! options.browser &&
				win.top && win.top.opener &&
				win.top.opener.steal && win.top.opener.steal.instrument )) {
				// force startFiles to load before instrument
				steals.push(noop, {
					src: "steal/instrument",
					waits: true
				});
			}
		} catch(e){
			// This would throw permission denied if
			// the child window was from a different domain
		}

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

	//win.steals = steals;
	win.resources = resources;
	win.Resource = Resource;

})( this );
