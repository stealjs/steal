/*
 * JavaScriptMVC - steal.js
 * (c) 2010 Jupiter JavaScript Consulting
 * 
 * steal provides dependency management
 * steal('path/to/file').then(function(){
 *   //do stuff with file
 * })
 */

/*jslint evil: true */
/*global steal: true, window: false */
//put everything in function to keep space clean
(function() {
	//weirdness for IE
	if ( typeof steal != 'undefined' && steal.nodeType ) {
		throw ("steal is defined an element's id!");
	}
	
	var // String constants (for better minification)
		win = (function(){return this}).call(null),
		STR_ONCLICK = "onclick",
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
		//get the browser (this only supports if it's rhino)
		browser = {
			rhino: win.load && win.readUrl && win.readFile
		},
		support = {
			inorder : typeof doc !== "undefined" &&
                                   typeof window !== "undefined" &&
                                   (doc.createElement("script").async ||
                               (win.opera && Object.prototype.toString.call(win.opera) === "[object Opera]") ||
                               //If Firefox 2 does not have to be supported, then
                               //a better check may be:
                               //('mozIsLocallyAvailable' in window.navigator)
                               ("MozAppearance" in doc.documentElement.style)) || browser.rhino,
	   		readyStateScript : win.document && "readyState" in scriptTag(),
			// if we'll get an error
			error : !win.document || "error" in scriptTag()
		},
		endsWithJS = /\.js$/i,
		addJS = function(path){
			return endsWithJS.test(path) ? path : path + '.js';
		};
	
	// HELPERS (if you are trying to understand steal, skip this part) -------------
	
	// keep a reference to the old steal
	var oldsteal = win.steal,
		// returns the document head (creates one if necessary)
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
		//get everything after /
		getLastPart = function( p ) {
			return p.match(/[^\/]+$/)[0];
		},
		//gets an XHR object
		factory = function() {
			return win.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		},
		// cleans up a script
		cleanUp = function(script) {
			script[ STR_ONREADYSTATECHANGE ]
				= script[ STR_ONCLICK ]
				= script[ STR_ONLOAD ]
				= script[STR_ONERROR]
				= null;
				
			head()[ STR_REMOVE_CHILD ]( script );
		},
		// used to queue waiting scripts in browsers that can loading in parallel and run in order
		scriptQueue = [],
		// runs the next scripts until there are no more or are unloaded ones
		runNext = function(){
		  var i=0, current;
		  while(current = scriptQueue[i]){
		    if(!current.loaded){
		      return;
		    }else{
		      scriptQueue.shift();
		      current.cb();
		    }
		  }
		
		},
		// writes script to the page
		// src - the 'jmvc-root' normalized src
		// 
		getScript = function(src, onload, returnScript, cached){
			var srcFile = steal.File(src),
				script ,
				orgSrc = src,
				callback = function( result ) {
					( script[ STR_ONCLICK ] || noop )();
					cleanUp(script);
					onload && onload(script);
				},
				error = function(){
					throw "steal.js "+orgSrc+" not loaded!"
				};
			// leave the path alone as much as possible ...
			if (!srcFile.isLocalAbsolute() && !srcFile.protocol() ) { 
				src = steal.root.join(src);
			}

			if(steal.options.useLoad){
				load(src);
				onload && onload()
				return;
			}
			if(support.inorder || cached){
				script = scriptTag();
				script.async = false;
				script[ STR_ONLOAD ] = callback;
				script[ STR_ONERROR ] = error;
			}else{
				if(support.readyStateScript){
					script = scriptTag();
					// we need to set the id before we do htmlFor
					script.id = steal.cleanId(src); 
					script.event = STR_ONCLICK;
					script.htmlFor = script.id;
					script[ STR_ONREADYSTATECHANGE ] = function() {
						stateCheck.test( script.readyState ) && callback();
					};
					script[ STR_ONERROR ] = error;
				}else{
					// Webkit browsers ....
					script = scriptTag("script/cache");
					// add to waiting ....
					var orgOnload = onload,
						obj = {
							loaded : false,
							cb : function(){
								getScript(orgSrc, orgOnload, false, true)
							}
						};
					onload = null;
					scriptQueue.push(obj);
					script[ STR_ONLOAD ] = function(){
						//run next ...
						callback();
						obj.loaded = true;
						runNext();
					}
					script[ STR_ONERROR ] = error;

				}
			}
			// set the id
			script.id = steal.cleanId(src); 
			
			// Set source
			script.src = src;

			// Append main script
			if(returnScript === true){
				return script;
			}else{
				head().insertBefore( script, head().firstChild );
			}
		},
		// converts a function to work with when
		convert = function(ob, func){
			
			var oldFunc = ob[func];
			if(!ob[func].callbacks){
				//replace start with a function that will call ob2's method
				ob[func] = function(){
					var me = arguments.callee,
						ret;
					
					//if we are a callee, and have been called, decrement the number of calls
					if(me.calls !== undefined){
						me.calls--;
					}
					//if we have been called the right number of times, or are not a callee
					if( me.calls === 0 || me.calls === undefined ) {
						// call the original function
						ret = oldFunc.apply(ob,arguments)
						var cbs = me.callbacks,
							len = cbs.length;
						
						//mark as called so any callees added to this caller will
						//automatically get called
						me.called = true;
						// call other callbacks
						for(var i =0; i < len; i++){
							cbs[i].obj[cbs[i].func](ob)
						}
						return ret;
					}
				}
				ob[func].callbacks = [];
			}
			//console.log(steal.fn.init.prototype.complete.wrapper)
			return ob[func];
		},
		// chains two functions.  When the first one is called,
		//   it calls the second function.
		//   If the second function has multiple callers, it waits until all have been called
		// 
		//   when(parent,"start", steal, "start")
		//
		// when can return a function to call once a 'pass' of whens have been added ...
		when = function(ob1, func1, ob2, func2){
			var f1 = convert(ob1,func1),
				f2 = convert(ob2, func2),
				ret;
	
			// if the caller has already been called, 
			if(ob1[func1].called){
				// call ob2 right away.
				ret = function(){ // timeout b/c calling func might need other things
					ob2[func2](ob1)
				}
			}else{
				// push the callee to be called later
				f1.callbacks.push({
					obj : ob2,
					func: func2
				});
			}
			// increment the number of times f2 needs to be called
			if(f2.calls === undefined){
				f2.calls=0;
			}
			f2.calls++;
			return ret;
		},
		// an implementation of each
		each = function(arr, cb){
			for(var i =0, len = arr.length; i <len; i++){
				cb.call(arr[i],i,arr[i])
			}
		},
		addEvent = function(elem, type, fn) {
			if ( elem.addEventListener ) {
				elem.addEventListener( type, fn, false );
			} else if ( elem.attachEvent ) {
				elem.attachEvent( "on" + type, fn );
			} else {
				fn();
			}
		},
		// the recently created steals.
		queue = [],
		// a map of steal files to map
		steals = {},
		// the current steal
		firstSteal,
		// the defines in the current 'load'
		defines = [];
		
	
	/**
	 * @class steal
	 * @parent stealjs
	 * <p>Steal makes JavaScript dependency management and resource loading easy.</p>
	 * <p>This page details the steal script (<code>steal/steal.js</code>), 
	 * and steal function which are used to load files into your page.  
	 * For documentation of other Steal projects, read [stealjs StealJS].</p>
	 * <h3>Quick Overview</h3>
	 * 
	 * <p>To start using steal, add the steal script to your page, and tell it the first
	 * file to load:</p>
	 * </p>
	 * @codestart html
	 *&lt;script type='text/javascript'
	 *        src='public/steal/steal.js?<u><b>myapp/myapp.js</b></u>'>&lt;/script>
	 * @codeend
	 * 
	 * <p>In the file (<code>public/myapp/myapp.js</code>), 
	 * 'steal' all other files that you need like:</p>
	 * @codestart
	 * steal("anotherFile")           //loads myapp/anotherFiles.js
	 *    .css('style')               //      myapp/style.css
	 *    .plugins('jquery/view',     //      jquery/view/view.js
	 *             'steal/less')      //      steal/less/less.js
	 *    .then(function(){           //called when all prior files have completed
	 *       steal.less('myapp')      //loads myapp/myapp.less
	 *    })
	 *    .views('//myapp/show.ejs')  //loads myapp/show.ejs
	 * @codeend
	 * <p>Finally compress your page's JavaScript and CSS with:</p>
	 * @codestart
	 * > js steal/buildjs path/to/mypage.html
	 * @codeend
	 * <h2>Use</h2>
	 * Use of steal.js is broken into 5 parts:
	 * <ul>
	 * <li>Loading steal.js </li> 
	 *  <li>Loading your 'application' file.</li>
	 *    <li>"Stealing" scripts</li>
	 *    <li>Building (Concatenating+Compressing) the app</li>
	 *    <li>Switching to the production build</li>
	 * </ul>
	 * 
	 * 
	 * <h3>Loading <code>steal.js</code></h3>
	 * <p>First, you need to [download download JavaScriptMVC] (or steal standalone) and unzip it into a
	 *    public folder on your server.  For this example, lets assume you have the steal script in
	 *    <code>public/steal/steal.js</code>.   
	 * </p>
	 * <p>Next, you need to load the <code>steal.js</code> script in your html page.  We suggest 
	 *    [http://developer.yahoo.com/performance/rules.html#js_bottom bottom loading] your scripts.
	 *    For example, if your page is in <code>pages/myapp.html</code>, you can get steal like:
	 * </p>
	 * @codestart html
	 * &lt;script type='text/javascript'
	 *     src='../public/steal/steal.js'>
	 * &lt;/script>
	 * @codeend
	 * <h3>Loading your 'application' file</h3>
	 * <p>The first file your application loads
	 * is referred to as an "application" file.  It loads all the files and resources
	 * that your application needs.  For this example, we'll put our application file in:
	 * <code>public/myapp/myapp.js</code>
	 * </p>
	 * <p>You have to tell steal where to find it by configuring [steal.static.options].
	 * There are a lot of ways to configure steal to load your app file, but we've made it really easy:</p>
	 * @codestart html
	 * &lt;script type='text/javascript'
	 *     src='../public/steal/steal.js?<u><b>myapp/myapp.js</b></u>'>
	 * &lt;/script>
	 * @codeend
	 * This sets ...
	 * @codestart
	 * steal.options.startFile = 'myapp/myapp.js'
	 * @codeend
	 * 
	 * ... and results in steal loading 
	 * <code>public/myapp/myapp.js</code>.</p>
	 * 
	 * <div class='whisper'>
	 *    TIP: If startFile doesn't end with <code>.js</code> (ex: myapp), steal assumes
	 *    you are using JavaScriptMVC's folder pattern and will load:
	 *    <code>myapp/myapp.js</code> just to save you 9 characters.
	 * </div>
	 * <h3>Stealing Scripts</h3>
	 * In your files, use the steal function and its helpers
	 *  to load dependencies then describe your functionality.
	 * Typically, most of the 'stealing' is done in your application file.  Loading 
	 * jQuery and jQuery.UI from google, a local helpers.js 
	 * and then adding tabs might look something like this:
	 * @codestart
	 * steal( 'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js',
	 *        'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.0/jquery-ui.js',
	 *        'helpers')
	 * .then( function(){
	 *   $('#tabs').tabs();
	 * });
	 * @codeend
	 * 
	 * There's a few things to notice:
	 * 
	 *   - the steal function can take multiple arguments.  Each argument 
	 *    can be a string, object, or function.  Learn more about what can be passed to 
	 *    steal in the [steal.prototype.init] documentation. 
	 *   - steal can load cross domain</li>
	 *   - steal loads relative to the current file</li>
	 *   - steal adds .js if not present</li>
	 *   - steal is chainable (most function return steal)
     * 
	 * ### Building the app
	 * 
	 * Building the app means combining and compressing your apps JavaScript and CSS into a single file.
	 * A lot more details can be found on building in the 
	 * [steal.build steal.build documentation].  But, if you used JavaScriptMVC's app or plugin
	 * generator, you can build
	 * your app's JS and CSS with:
	 * 
	 * 
	 * @codestart no-highlight
	 * js myapp\scripts\compress.js
	 * @codeend
	 * 
	 * Or if you are using steal without JavaScriptMVC:
	 * 
	 * @codestart no-highlight
	 * js steal/buildjs pages/myapp.html -to public/myapp
	 * @codeend
	 * 
	 * This creates <code>public/myapp/production.js</code> and <code>public/myapp/production.css</code>.
	 * 
	 * ### Switching to the production build
	 * 
	 * To use the production files, load steal.production.js instead of steal.js in your html file:
	 * 
	 * @codestart html
	 * &lt;script type='text/javascript'
	 *         src='../public/steal/<u><b>steal.production.js</b></u>?myapp/myapp.js'>
	 * &lt;/script>
	 * @codeend
	 * 
	 * ## Steal helpers
	 * 
	 * There are a number of steal helper functions that can be used to load files in a particular location
	 * or of a type other than JavaScript:
	 * 
	 *  * [steal.static.coffee] - loads  
	 *     [http://jashkenas.github.com/coffee-script/ CoffeeScript] scripts.
	 *  * [steal.static.controllers] - loads controllers relative to the current path.
	 *  * [steal.static.css] - loads a css file.
	 *  * [steal.static.less] - loads [http://lesscss.org/ Less] style sheets.
	 *  * [steal.static.models] - loads models relative to the current path.
	 *  * [steal.static.plugins] - loads JavaScript files relative to steal's root folder.
	 *  * [steal.static.resources] - loads a script in a relative resources folder.
	 *  * [steal.static.views] - loads a client side template to be compiled into the production build.
	 * 
	 * ## Script Load Order
	 * 
	 * @constructor 
	 * Loads files or runs functions after all previous files and functions have been loaded.
	 * @param {String|Object|Function+} resource Each argument represents a resource or function.
	 * Arguments can be a String, Object, or Function.
	 * <table class='options'>
	 *  <tr>
	 *  <th>Type</th><th>Description</th>
	 *  </tr>
	 *  <tr><td>String</td>
	 * <td>A path to a JavaScript file.  The path can optionally end in '.js'.<br/>  
	 * Paths are typically assumed to be relative to the current JavaScript file. But paths, that start
	 * with: 
	 * <ul>
	 * <li><code>http(s)://</code> are absolutely referenced.</li>
	 * <li><code>/</code> are referenced from the current domain.</li>
	 * <li><code>//</code> are referenced from the ROOT folder.</li>
	 * 
	 * </td></tr>
	 *  <tr><td>Object</td>
	 *  <td>An Object with the following properties:
	 *  <ul>
	 *  <li>path {String} - relative path to a JavaScript file.  </li>
	 *  <li>type {optional:String} - Script type (defaults to text/javascript)</li>
	 *  <li>skipInsert {optional:Boolean} - Include not added as script tag</li>
	 *  <li>compress {optional:String} - "false" if you don't want to compress script</li>
	 *  <li>packaged {optional:Boolean} - false if script will not be added to package and loaded on its own.</li> 
	 *  <li>ignore {optional:Boolean} - true if script will only be loaded in development mode</li>
	 *  </ul>
	 *  </td></tr>
	 *  <tr><td>Function</td><td>A function to run after all the prior steals have finished loading</td></tr>
	 * </table>
	 * @return {steal} returns itself for chaining.
	 */
	
		
	steal = function() {
		//set the inital
		var createdFirst = false;
		if(!cur){
			firstSteal = cur = new steal.fn.init();
			createdFirst = true;
		}
		// save the arguments to steal until a 'load' call
		queue.push.apply(queue,  arguments);
		
		if(createdFirst){
			var oldCur = cur, 
				go = function(){
					var res = when(oldCur, "complete", steal, "startjQuery");
					oldCur.loaded();
					res && res();
				}
			
			if(browser.rhino && !window.setTimeout){
				go()
			}else{
				setTimeout(go,0)
			}
			
		}
		return steal;
	};

	
	steal.fn = steal.prototype = {
		// adds a new steal and throws an error if the script doesn't load
		// this also checks the steals map
		make: function(options){
			
			var stel = new steal.fn.init(options)
			
			if(stel.unique && stel.path){
				
				if(!steals[stel.path]){  //if we haven't loaded it before
					
					steals[stel.path] = stel;
					
					if(!support.error){
						stel.completeTimeout = setTimeout(function(){
							throw "steal.js : "+stel.path+" not completed"
						},5000);
					}
					
					
				}
				stel = steals[stel.path];
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
			
			// if we have no options, we are the global init ... set ourselves up ...
			if(!options){ //global init cur ...
				this.waits = false;
				this.pack = "production.js";
			} 
			//handle callback functions	
			else if ( typeof options == 'function' ) {
			
				var path = File.cur().path;
				this.path = path;
				this.waits = true;
				// what to call 
				this.func = function() {
					
					//set the path ..
					File.cur(path);
					
					// call the function, someday soon this will be requireJS-like
					options(steal.send || win.jQuery || steal); 
				};
				// save the function for later ...
				this.options = options;

			} else {
				
				//if it's just a string
				if ( typeof options == 'string' ) {
					options = {
						//add .js to path if nothing is given
						path: addJS(options)
					};
				}
				
				this.unique = true;
				this.type = options.type || "text/javascript"
				this.resource = options.resource || "script";
				this.waits = options.waits || false;
				
				var pathFile = steal.File(options.path),
					normalized = insertMapping( pathFile.normalize() );
				
				//add default options
				extend(this,options);
				
				//add path related options
				extend(this,{
					originalPath : options.path,
					
					// path normalized from steal's root, this is as good as an abs path ...
					path : normalized,
					
					dir : steal.File(normalized).dir(),
					pathFromPage : steal.root.join(normalized),
					id: steal.cleanId(normalized)
				});
			}
		},
		complete : function(){
			if(this === firstSteal){ // this is the last steal
				cur = null;
			}
			this.completeTimeout && clearTimeout(this.completeTimeout)
		},
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
			jQueryCheck();
			
//			console.log("LOADED ",this.path)
			
			
			//mark yourself as current
			steal.cur(this);
			
			File.cur(this.path)
			
			if(!myqueue){
				myqueue = queue.slice(0);
				queue = [];
			}
			
			// if we have nothing, mark us as complete
			if(!myqueue.length){
				this.complete();
				return;
			}
			
			// now we have to figure out how to wire up our steals
			var self = this,
				set = [],
				start = this, // this is who we are listening to
				stel,
				initial = [],
				callers = [],
				isProduction = steal.options.env == 'production';
				
			//now go through what you stole and hook everything up
			each(myqueue, function(i, item){
				//check for ignored before even making ...
				if(isProduction && item.ignore){
					return;
				}
				
				// make a steal object
				stel = steal.fn.make( item );
				
				// add it as a dependency, circular are not allowed
				self.dependencies.push(stel)
				
				
				if(stel.waits === false){
					
					set.push(stel);
					
					if(start ===self){ //we are the first files ...
						initial.push(stel)
					}else{
						callers.push( when(start,"complete",stel,"load") ) //blah blah
					}
					
				}else{
					each(set,function(){
						callers.push( when(this,"complete", stel, "load") ) // if already complete .. call load
					})
					set = [stel];
					start = stel;
					if(!initial.length){ //if we start with a function
						initial.push(stel)
					}
				}
			})
			
			//tell last set, or last function to call complete ...
			if(set.length){

				each(set, function(){ 
					callers.push( when(this,"complete",self,"complete") );
				});
				
			}else{
				callers.push( when(stel,"complete",self,"complete") );
			}
			
			each(callers, function(i, f){
				if (f) {
					f();
				}
			})
			

			var frag = doc && doc.createDocumentFragment(),
				headEl;
				
			each(initial, function(){
				var el = this.load(frag);
				//console.log(">>>>>",el&&el.src, this.path);
				if(el){
					frag.appendChild(el)
				}
			});
			if(frag){
				headEl = head();
				headEl.insertBefore( frag, headEl.firstChild );
			}
			
		},
		/**
		 * When the script loads, 
		 */
		load: function(returnScript) {
			//console.log("  LOAD ", this.path,this.func ? " f()" : "", this.loading)
			if(this.loading){
				return;
			}
			this.loading = true;
			
			// ejs and other types don't get inserted in the page
			if (this.type && this.type != 'text/javascript') {
				this.loaded();
				return;
			}
			
			if (this.func) {
				//console.log(this.path, this);
				this.func();
				this.loaded();
			} else {
				var self = this;
				//console.log(returnScript,"------------")
				return getScript(this.path, function(){
					//mark as loaded ...
					self.loaded();
				}, returnScript);
			}

		}

	};
	steal.fn.init.prototype = steal.fn;
	//where the root steal folder is
	steal.root = null;

	//provide extend to others
	steal.extend = extend;
	//save a reference to the browser
	steal.browser = browser;


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
		this.path = typeof path == 'string'?path : path.path;
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
			if ( this.path.indexOf('file:') === 0 ) {
				return null;
			}
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
		 * Does the same thing as join, but takes into account mappings setup in steal.map
		 * @param {Object} url
		 */
		mapJoin: function( url ){
			url = insertMapping(url);
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
				if ( this.domain() && this.domain() == u.domain() ) {
					return this.afterDomain();
				}
				else if ( this.domain() == u.domain() ) { // we are from a file
					return this.toReferenceFromSameDomain(url);
				} else {
					return this.path;
				}

			} else if ( url === steal.pageDir && !expand ) {

				return this.path;

			} else if ( this.isLocalAbsolute() ) { // we are a path like /page.js
				if (!u.domain() ) {
					return this.path;
				}

				return u.protocol() + "//" + u.domain() + this.path;

			}
			else { //we have 2 relative paths, remove folders with every ../
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
		 * Joins the file to the current working directory.
		 */
		joinCurrent: function() {
			return this.joinFrom(File.cur().dir());
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
			for ( var i = 0; i < other_parts.length; i++ ) {
				result += '../';
			}
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

			} else if ( this.relative() 
					|| (File.cur().isCrossDomain() && //if current file is on another domain and
						!this.protocol()) ) { //this file doesn't have a protocol
				path = this.joinFrom(current);
			}
			return path;
		}
	});
	/**
	 *  @add steal
	 */
	// break
	/* @static */
	//break
	

	//find steal
	/**
	 * @attribute options
	 * Options that deal with steal
	 * <table class='options'>
	 * <tr>
	 *     <th>Option</th><th>Default</th><th>Description</th>
	 * </tr>
	 * <tr><td>env</td><td>development</td><td>Which environment is currently running</td></tr>
	 * <tr><td>encoding</td><td>utf-8</td><td>What encoding to use for script loading</td></tr>
	 * <tr><td>cacheInclude</td><td>true</td><td>true if you want to let browser determine if it should cache script; false will always load script</td></tr>
	 * 
	 * <tr><td>done</td><td>null</td><td>If a function is present, calls function when all steals have been loaded</td></tr>
	 * <tr><td>documentLocation</td><td>null</td><td>If present, ajax request will reference this instead of the current window location.  
	 * Set this in run_unit, to force unit tests to use a real server for ajax requests. </td></tr>
	 * <tr><td>logLevel</td><td>0</td><td>0 - Log everything<br/>1 - Log Warnings<br/>2 - Log Nothing</td></tr>
	 * <tr><td>startFile</td><td>null</td><td>This is the first file to load.  It is typically determined from the first script option parameter 
	 * in the inclue script. </td></tr>
	 * </table>
	 * 
	 *  - <code>steal.options.startFile</code> - the first file steal loads.  This file
	 *    loads all other scripts needed by your application.
	 *  - <code>steal.options.env</code> - the environment (development or production)
	 *    that determines if steal loads your all your script files or a single
	 *    compressed file.
	 *    
	 * 
	 * <code>steal.options</code> can be configured by:
	 * 
	 *  - The steal.js script tag in your page (most common pattern).</li>
	 *  - An existing steal object in the window object</li>
	 *  - <code>window.location.hash</code>
	 * 
	 * 
	 * The steal.js script tag is by far the most common approach. 
	 * For the other methods,
	 * check out [steal.static.options] documentation.
	 * To load <code>myapp/myapp.js</code> in development mode, your 
	 * script tag would look like:
	 * 
	 * 
	 * @codestart
	 * &lt;script type='text/javascript'
	 *     src='path/to/steal.js?<u><b>myapp/myapp.js</b></u>,<u><b>development</b></u>'>
	 * &lt;/script>
	 * @codeend
	 * <div class='whisper'>
	 * Typically you want this script tag right before the closing body tag (<code>&lt;/body></code>) of your page.
	 * </div>
	 * <p>Note that the path to <code>myapp/myapp.js</code> 
	 * is relative to the 'steal' folder's parent folder.  This
	 * is typically called the JavaScriptMVC root folder or just root folder if you're cool.</p>
	 * <p>And since JavaScriptMVC likes folder structures like:</p>
	 * @codestart text
	 * \myapp
	 *    \myapp.js
	 * \steal
	 *    \steal.js
	 * @codeend
	 * <p>If your path doesn't end with <code>.js</code>, JavaScriptMVC assumes you are loading an 
	 * application and will add <code>/myapp.js</code> on for you.  This means that this does the same thing too:</p>
	 * @codestart
	 * &lt;script type='text/javascript'
	 *        src='path/to/steal.js?<u><b>myapp</b></u>'>&lt;/script>
	 * @codeend
	 * <div class='whisper'>Steal, and everything else in JavaScriptMVC, provide these little shortcuts
	 * when you are doing things 'right'.  In this case, you save 9 characters 
	 * (<code>/myapp.js</code>) by organizing your app the way, JavaScriptMVC expects.</div>
	 * </div>
	 */
	steal.options = {
		loadProduction: true,
		env: 'development',
		production: null,
		encoding: "utf-8",
		cacheInclude: true,
		logLevel: 0
	};
	
	
	
	
	// variables used while including
	var graph = [],
		//If we haven't steald a file yet
		first_wave_done = false,
		//a list of all steald paths
		cwd = '',
		//  the current steal
		cur = null;
	
	extend(steal, {
		dependencies : steals,
		head: head,
		//root mappings to other locations
		mappings: {},
		/**
		 * Maps a 'rooted' folder to another location.
		 * @param {String|Object} from the location you want to map from.  For example:
		 *   'foo/bar'
		 * @param {String} [to] where you want to map this folder too.  Ex: 'http://foo.cdn/bar'
		 * @return {steal}
		 */
		map: function(from, to){
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
		},
		when : when,
		/**
		 * Gets options from script
		 * @hide
		 */
		getScriptOptions: function() {
			if(!doc){
				return {};
			}
			var scripts = doc[STR_GET_BY_TAG]("script"),
				scriptOptions, 
				commaSplit, 
				stealReg = /steal\.(production\.)?js/,
				options = {};

			
			//find the steal script and setup initial paths.
			for ( var i = 0; i < scripts.length; i++ ) {
				var src = scripts[i].src;
				if ( src && stealReg.test(src) ) { //if script has steal.js
					options.pathToSteal = src;
					
					/*var mvc_root = File(File(src).joinFrom(steal.pageDir)).dir(),
						loc = /\.\.$/.test(mvc_root) ? mvc_root + '/..' : mvc_root.replace(/steal$/, '');

					if (/.+\/$/.test(loc) ) {
						loc = loc.replace(/\/$/, '');
					}*/

					if (/steal\.production\.js/.test(src) ) {
						options.env = "production";
					}
					//steal.root = File(loc);
					if ( src.indexOf('?') != -1 ) {
						scriptOptions = src.split('?')[1];
					}
				}

			}

			//if there is stuff after ?
			if ( scriptOptions ) {
				// if it looks like steal[xyz]=bar, add those to the options
				if ( scriptOptions.indexOf('=') > -1 ) {
					scriptOptions.replace(/steal\[([^\]]+)\]=([^&]+)/g, function( whoe, prop, val ) {
						options[prop] = val;
					});
				} else {
					//set with comma style
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
		},

		/**
		 * This is where the dom-specific magic of steal should happen ...
		 * 
		 * - figure out the current page and path stuff
		 * - set options from script tag, initial steal, and hash
		 * - load initial files 
		 * 
		 * @hide
		 */
		init: function() {

			// GET OPTIONS FROM ...
			
			// the script tag
			extend(steal.options, this.getScriptOptions());
			// a steal that existed before this steal
			if(typeof oldsteal == 'object'){
				extend(steal.options, oldsteal);
			}
			
			// the hash
			if(win.location){
				win.location.hash.replace(/steal\[(\w+)\]=(\w+)/g, function( whoe, prop, val ) {
					steal.options[prop] = val;
				});
			}
			
			// CALCULATE CURRENT LOCATION OF THINGS ...
			
			// the place we are running code from
			steal.pageDir = File(steal.options.location !== undefined ? steal.options.location : win.location.href).dir();
			
			// the steal root folder
			var mvc_root = File(File(steal.options.pathToSteal).joinFrom(steal.pageDir)).dir(),
				loc = /\.\.$/.test(mvc_root) ? mvc_root + '/..' : mvc_root.replace(/steal$/, '');
			if (/.+\/$/.test(loc) ) {
				loc = loc.replace(/\/$/, '');
			}
			steal.root = File(loc);


			// CLEAN UP OPTIONS
			if ( steal.options.app ) {
				steal.options.startFile = steal.options.app + "/" + steal.options.app.match(/[^\/]+$/)[0] + ".js";
			}
			if ( steal.options.ignoreControllers ) {
				steal.controllers = function() {
					return steal;
				};
				steal.controller = function() {
					return steal;
				};
			}
			//calculate production location;
			if (!steal.options.production && steal.options.startFile ) {
				steal.options.production = "//" + File(steal.options.startFile).dir() + '/production';
			}
			if ( steal.options.production ) {
				steal.options.production = steal.options.production + (steal.options.production.indexOf('.js') == -1 ? '.js' : '');
			}
			//we only load things with force = true
			if ( steal.options.env == 'production' && steal.options.loadProduction ) {
				if ( steal.options.production ) {
					//steal(steal.options.startFile);
					steal({
						path: steal.options.production,
						force: true
					});
				}

			} else {
				var steals = [];
				if(steal.options.loadDev !== false){
					steals.push({
						path: 'steal/dev/dev.js',
						ignore: true
					});
				}

				//if you have a startFile load it
				if ( steal.options.startFile ) {
					//steal(steal.options.startFile);
					steals.push(steal.options.startFile)
					//steal._start = new steal.fn.init(steal.options.startFile);
					//steal.queue(steal._start);
				}
				if(steals.length){
					steal.apply(null, steals);
				}
				
			}
		},
		cur: function( file ) {
			if ( file !== undefined ) {
				return cur = (typeof file == 'string' ? new steal.fn.init(file) : file);
			} else {
				return cur;
			}
		},
		// called when a script has loaded via production
		loaded: function(name){
			// console.log("LOADED "+name)
			//get other steals
			//basically create each one ... mark it as loading
			//  load each one
			var stel = steal.fn.make( name );
			stel.loading = true;
			var myqueue = queue.slice(0);
			queue = [];

			stel.loaded(myqueue)

			return steal;
		},
		/**
		 * @hide
		 * Used to tell steal that it is loading a number of plugins
		 */
		loading : function(){
			for(var i =0; i< arguments.length;i++){
				var stel = steal.fn.make( arguments[i] );
				stel.loading = true;
			}
			
		},
		done: function(ob, cb) {
			if(typeof ob == 'function' && !cb){
				ob = {
					func: ob
				}
				cb = 'func'
			}
			return when(firstSteal, "complete", ob,cb)
		},
		/**
		 * Loads css files from the given relative path.
		 * @codestart
		 * steal.css('mystyles') //loads mystyles.css
		 * @codeend
		 * Styles loaded in this way will be compressed into a single style.
		 * @param {String+} relative URL(s) to stylesheets
		 * @return {steal} steal for chaining
		 */
		css: function() {
			
			//if production, 
			if ( steal.options.env == 'production' ) {
				if ( steal.loadedProductionCSS ) {
					return steal;
				} else {
					var productionCssPath = steal.File(steal.options.production.replace(".js", ".css")).normalize();
					productionCssPath = steal.root.join(productionCssPath);
					var el = steal.createLink(productionCssPath),
						headEl = head();
					headEl.insertBefore( el, headEl.firstChild );
					steal.loadedProductionCSS = true;
					return steal;
				}
			}
			for(var i =0; i < arguments.length; i++){
				steal({
					path : arguments[i]+".css",
					load : this.cssLoad,
					type : "text/css",
					resource : "style"
				})
			}
			return this;
		},
		cssLoad : function(){
			//console.log("  LOAD ",this.path)
			var src = this.path,
				srcFile = steal.File(src);
			if (!srcFile.isLocalAbsolute() && !srcFile.protocol() ) {
				src = steal.root.join(src);
			}
			var el = steal.createLink(src)
			this.loaded();
			return;
		},
		/**
		 * Creates a css link and appends it to head.
		 * @hide
		 * @param {Object} location
		 * @return {HTMLLinkElement}
		 */
		createLink: function( location, options ) {
			options = options || {};
			var link = doc[STR_CREATE_ELEMENT]('link');
			link.rel = options.rel || "stylesheet";
			link.href = location;
			link.type = options.type || 'text/css';
			head().appendChild(link);
			return link;
		},
		/**
		 * @hide
		 * Synchronously requests a file.  This is here to read a file for other types.	 * 
		 * @param {String} path path of file you want to load
		 * @param {optional:String} content_type optional content type
		 * @return {String} text of file
		 */
		request: function( path, content_type ) {
			var contentType = (content_type || "application/x-www-form-urlencoded; charset=" + steal.options.encoding),
				request = factory();
			request.open("GET", path, false);
			request.setRequestHeader('Content-type', contentType);
			if ( request.overrideMimeType ) {
				request.overrideMimeType(contentType);
			}

			try {
				request.send(null);
			}
			catch (e) {
				return null;
			}
			if ( request.status === 500 || request.status === 404 || request.status === 2 || (request.status === 0 && request.responseText === '') ) {
				return null;
			}
			return request.responseText;
		},
		// returns a function that will call f on each one of its args
		callOnArgs: function( f ) {
			return function() {
				for ( var i = 0; i < arguments.length; i++ ) {
					f(arguments[i]);
				}
				return steal;
			};

		},
		// Returns a function that applies a function to a list of arguments.  Then steals those
		// arguments.
		applier: function( f ) {
			return function() {
				var args = [];
				for ( var i = 0; i < arguments.length; i++ ) {
					if ( typeof arguments[i] == "function" ) {
						args[i] = arguments[i];
					} else {
						args[i] = f(arguments[i]);
					}

				}
				steal.apply(null, args);
				return steal;
			};
		},
		/**
		 * Calls these scripts after
		 */
		then: steal,
		/**
		 * Essentially calls steal
		 */
		and : steal
	});
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
	},
	stealPlugin = function( p ) {
		return steal( typeof p == 'function' ? 
					  p :
				      (/^(http|\/)/.test(p) ? "": "//")+ p + '/' + getLastPart(p) );
	};
		
	steal.packs = function() {
		for ( var i = 0; i < arguments.length; i++ ) {
			if ( typeof arguments[i] == "function" ) {
				steal(arguments[i]);
			} else {
				steal({
					force: true,
					path: "//packages/" + arguments[i] + ".js"
				});
			}
		}
		return this;
	};

	extend(steal, {

		/**
		 * @function plugins
		 * Loads a list of plugins given a path relative to steal's ROOT folder.
		 * 
		 * Steal.plugins is used to load relative to ROOT no matter where the current file is 
		 * located.  For example, if you want to load the 'foo/bar' plugin that is located like:
		 * 
		 * @codestart
		 * steal\
		 * foo\
		 *    bar\
		 *       bar.js
		 * @codeend
		 * 
		 * You can load it like:
		 * 
		 * @codestart
		 * steal.plugins('foo/bar');
		 * @codeend
		 * 
		 * It should be noted that plugins always looks for a JS file that shares the name of the
		 * plugin's folder (bar.js is in bar).
		 * 
		 * @param {String} plugin_location location of a plugin, ex: jquery/dom/history.
		 * @return {steal} a new steal object
		 * 
		 */
		plugins: steal.callOnArgs(stealPlugin),


		/**
		 * @function controllers
		 * Loads controllers from the current file's <b>controllers</b> directory.
		 * <br>
		 * <code>steal.controllers</code> adds the suffix <code>_controller.js</code> to each name passed in.
		 * <br>
		 * <br>
		 * Example:
		 * <br>
		 * If you want to load controllers/recipe_controller.js and controllers/ingredient_controller.js,
		 * write:
		 * @codestart 
		 *  steal.controllers('recipe',
		 *                    'ingredient')
		 * @codeend
		 * @param {String+} controller the name of of the {NAME}_controller.js file to load. You can pass multiple controller names.
		 * @return {steal} the steal function for chaining.    
		 */
		controllers: steal.applier(function( i ) {
			if ( i.match(/^\/\//) ) {
				i = steal.root.join(i.substr(2));
				return i;
			}
			return 'controllers/' + i + '_controller';
		}),

		/**
		 * @function models
		 * Loads models  from the current file's <b>models</b> directory.
		 * <br>
		 * <br>
		 * Example:
		 * <br>
		 * If you want to include models/recipe.js and models/ingredient.js,
		 * write:
		 * @codestart 
		 *  steal.models('recipe',
		 *               'ingredient')
		 * @codeend
		 * @param {String+} model The name of the model file you want to load.  You can pass multiple model names.
		 * @return {steal} the steal function for chaining.
		 */
		models: steal.applier(function( i ) {
			if ( i.match(/^\/\//) ) {
				i = steal.root.join(i.substr(2));
				return i;
			}
			return 'models/' + i;
		}),

		/**
		 * @function resources
		 * Loads resources from the current file's <b>resources</b> directory.
		 * <br>
		 * <br>
		 * Example:
		 * <br>
		 * If you want to load resources/i18n.js, write:
		 * @codestart 
		 *  steal.resources('i18n')
		 * @codeend
		 * @param {String+} resource The name of the resource file you want to load.  You can pass multiple model names.
		 * @return {steal} the steal function for chaining.
		 */
		resources: steal.applier(function( i ) {
			if ( i.match(/^\/\//) ) {
				i = steal.root.join(i.substr(2));
				return i;
			}
			return 'resources/' + i;
		}),

		/**
		 * @function views
		 * Loads views to be added to the production build.  Paths must be given from steal's ROOT folder.
		 * <br>
		 * <br>
		 * Example:
		 * <br>
		 * The following loads, coookbook/views/recipe/show.ejs and coookbook/views/recipe/list.ejs:
		 * @codestart 
		 *  steal.views('//coookbook/views/recipe/show.ejs',
		 *              '//coookbook/views/recipe/list.ejs')
		 * @codeend
		 * @param {String} path The view's path rooted from steal's root folder.
		 * @return {steal} the steal function for chaining.   
		 */
		views: function() {
			// Only includes views for compression and docs (when running in rhino)
			if ( browser.rhino || steal.options.env == "production" ) {
				for ( var i = 0; i < arguments.length; i++ ) {
					steal.view(arguments[i]);
				}
			}
			return steal;
		},

		timerCount: 0,
		view: function( path ) {
			var type = path.match(/\.\w+$/gi)[0].replace(".", "");
			if( path.indexOf("//") !== 0 ){
				path = "views/"+path;
			}
			steal({
				path: path,
				type: "text/" + type,
				compress: "false"
			});
			return steal;
		},
		cleanId: function( id ) {
			return id.replace(/[\/\.]/g, "_");
		},
		startjQuery : function(){
			if (jQueryIncremented) {
                jQ.readyWait -= 1;
            }
		}
	});
	//for integration with other build types
	if (!steal.build ) {
		steal.build = {
			types: {}
		};
	}

	steal.loadedProductionCSS = false;

	steal.init();
	steal.windowloaded = function(){};
	
	addEvent(win, "load", function(){
		steal.windowloaded();
	});
	
	steal.bothloaded = function(){
		steal.isReady = true;
	};
	if(firstSteal){
		when(firstSteal, "complete", steal,"bothloaded");
		when(steal,"windowloaded",steal,"bothloaded");
	}
	

	steal.load = function(ob, cb) {
		if(typeof ob == 'function' && !cb){
			ob = {
				func: ob
			}
			cb = 'func'
		}
		when(steal, "bothloaded", ob,cb)
	};
	var jQueryIncremented = false,
		jQ;
	
	function jQueryCheck() {

        var $ = typeof jQuery !== "undefined" ? jQuery : null;
        if ($ && "readyWait" in $) {
            
            //Increment jQuery readyWait if ncecessary.
            if (!jQueryIncremented) {
                jQ = $;
				$.readyWait += 1;
                jQueryIncremented = true;
            }
        }
  
    }
})();
