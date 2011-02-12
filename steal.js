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
	var startTime = new Date();
	
	var // String constants (for better minification)
		STR_ASYNC = "async",
		STR_ERROR = "error",
		STR_ON = "on",
		STR_ONCLICK = STR_ON + "click",
		STR_ONLOAD = STR_ON + "load",
		STR_ONREADYSTATECHANGE = STR_ON + "readystatechange",
		STR_REMOVE_CHILD = "removeChild",
		STR_CREATE_ELEMENT = 'createElement'
		noop = function(){},
		stateCheck = /loaded|complete/;
		
	if ( typeof steal != 'undefined' && steal.nodeType ) {
		throw ("steal is defined an element's id!");
	}

	// HELPERS (if you are trying to understand steal, skip this part)
	// keep a reference to the old steal
	var oldsteal = window.steal,
		// returns the document head (creates one if necessary)
		head = function() {
			var d = document,
				de = d.documentElement,
				heads = d.getElementsByTagName("head"),
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
		// creates a script tag
		scriptTag = function() {
			var start = document[STR_CREATE_ELEMENT]('script');
			start.type = 'text/javascript';
			return start;
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
		//get the browser
		browser = {
			msie: !! (window.attachEvent && !window.opera),
			opera: !! window.opera,
			safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
			firefox: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
			mobilesafari: !! navigator.userAgent.match(/Apple.*Mobile.*Safari/),
			rhino: navigator.userAgent.match(/Rhino/) && true
		},
		//gets an XHR object
		factory = function() {
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		},
		// writes a steal to the page in a way that steal.end gets called after the script gets run
		writeScript = function(src, attrs, onload, returnScript){
			var srcFile = steal.File(src),
				script = scriptTag(),
				cleanUp = function() {
					script[ STR_ONREADYSTATECHANGE ]
						= script[ STR_ONCLICK ]
						= script[ STR_ONLOAD ]
						= null;
					//console.log("clear")
					head()[ STR_REMOVE_CHILD ]( script );
					//scriptAfter && head[ STR_REMOVE_CHILD ]( scriptAfter );
				},
				callback = function( result ) {
					( script[ STR_ONCLICK ] || noop )();
					cleanUp();
					onload && onload(script);
					
				};
			//src should be relative to steal
			if (!srcFile.isLocalAbsolute() && !srcFile.protocol() ) {
				src = steal.root.join(src);
			}
			
			// set the id
			script.id = steal.cleanId(src); 
			
			// prevent out of order execution
			script[ STR_ASYNC ] = "false"	
				
			// IE: event/htmlFor/onclick trick
			// One can't rely on proper order for onreadystatechange
			// We have to sniff since FF doesn't like event & htmlFor... at all
			if ( browser.msie ) {
				
				script.event = STR_ONCLICK;
				script.htmlFor = script.id;
				script[ STR_ONREADYSTATECHANGE ] = function() {
					stateCheck.test( script.readyState ) && callback();
				};
				
			// All others: standard handlers
			} else {					
			
				script[ STR_ONLOAD ] = callback;
			}
			// Set source
			script.src = src;
			for ( var attr in attrs ) {
				script.setAttribute(attr, attrs[attr] )
			}
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
		when = function(ob1, func1, ob2, func2){
			var f1 = convert(ob1,func1),
				f2 = convert(ob2, func2);
	
			// if the caller has already been called, 
			if(ob1[func1].called){
				// call ob2 right away.
				setTimeout(function(){
					//print("calling")
					ob2[func2](ob1)
				},1)
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
		map = {},
		// the current steal
		init,
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
	 * The load order for your scripts follows a consistent last-in first-out order across all browsers. 
	 * This is the same way the following document.write would work in msie, Firefox, or Safari:
	 * @codestart
	 * document.write('&lt;script type="text/javascript" src="some_script.js"></script>')
	 * @codeend
	 * An example helps illustrate this.<br/>
	 * <img src='http://wiki.javascriptmvc.com/images/last_in_first_out.png'/>
	 * <table class="options">
	 * <tr class="top">
	 * <th>Load Order</th>
	 * <th class="right">File</th>
	 * </tr>
	 * <tbody>
	 * <tr>
	 * <td>1</td>
	 * <td class="right">1.js</td>
	 * </tr>
	 * <tr>
	 * <td>2</td>
	 * <td class="right">3.js</td>
	 * </tr>
	 * <tr>
	 * <td>3</td>
	 * <td class="right">4.js</td>
	 * </tr>
	 * <tr>
	 * <td>4</td>
	 * <td class="right">2.js</td>
	 * </tr>
	 * <tr>
	 * <td>5</td>
	 * <td class="right">5.js</td>
	 * </tr>
	 * <tr class="bottom">
	 * <td>6</td>
	 * <td class="right">6.js</td>
	 * </tr>
	 *</tbody></table>
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
	 *  <li>package {optional:String} - Script package name (defaults to production.js)</li> 
	 *  </ul>
	 *  </td></tr>
	 *  <tr><td>Function</td><td>A function to run after all the prior steals have finished loading</td></tr>
	 * </table>
	 * @return {steal} returns itself for chaining.
	 */
	
		
	steal = function() {
		//set the inital
		if(!cur){
			init = cur = new steal.fn.init()
		}
		// save this steal call until a 'load'
		queue.push.apply(queue,  arguments);

		return steal;
	};
	steal.dependencies = map;
	steal.mappings = {};
	steal.map = function(mappings, path){
		if(typeof mappings == "string"){
			steal.mappings[mappings] = path;
		} else { // its an object
			for(var key in mappings){
				steal.mappings[key] = mappings[key];
			}
		}
	}
	steal.fn = steal.prototype = {
		
		make: function(options){
			//we should check the map, but screw it for now
			var stel = new steal.fn.init(options)
			
			if(stel.kind === "file" && stel.path){
				if(!map[stel.path]){
					//print("  Adding  "+stel.path)
					map[stel.path] = stel;
					
					stel.completeTimeout = setTimeout(function(){
						throw "steal.js : "+stel.path+" not completed"
					},5000)
				}
				stel = map[stel.path];
			}
			
			return stel;
		},
		init: function( options) {

			this.dependencies = [];
			if(!options){ //global init cur ...
				var self = this;
				this.kind="file";
				setTimeout(function(){
					this.pack = "production.js"
					self.loaded();
					when(self, "complete", steal, "startjQuery")
				},0);
				return;
			}
			
			//handle callback functions
			if ( typeof options == 'function' ) {
				var path = File.cur().path;
				this.path = path;
				this.func = function() {
					//
					File.cur(path);//.dir(path);
					//console.log(steal.send , window.jQuery , steal, options, path)
					options(steal.send || window.jQuery || steal); //should return what was steald before 'then'
				};
				this.options = options;
				
				return;
			}
			//if it's just a string
			if ( typeof options == 'string' ) {
				options = {
					//add .js to path if nothing is given
					path: /\.js$/i.test(options) ? options : options + '.js'
				};
			}
			this.type = options.type || "text/javascript"
			this.kind = 'file'
			var pathFile = steal.File(options.path),
				normalized = pathFile.normalize();
			//console.log(options.path,"->",normalized)
			//add default options
			extend(this,options);
			
			//add path related options
			extend(this,{
				originalPath : options.path,
				path : normalized,
				absolute : 
				    // if it starts with //path
					options.path.match(/^\/\//) ? 
						steal.root.join(options.path.substr(2)) :
						( pathFile.relative() ? pathFile.joinFrom(File.cur().getAbsolutePath(), true) : normalized ),
				dir : steal.File(normalized).dir(),
				pathFromPage : !pathFile.isLocalAbsolute() && !pathFile.protocol() ? steal.root.join(normalized) : normalized,
				id: steal.cleanId(normalized)
			})

			var self = this;
			
		},
		complete : function(){
			clearTimeout(this.completeTimeout)
			//console.log("completed "+this.path, this === init)
			/*console.log("      COMPLETED  ",this.path+" "+(this.func ? "f()" : ""),
					mapA(this.complete.callbacks,function(item){
				return item.obj.path+
					(item.obj.func?" f()":"")+
						":"+item.func+" "+item.obj[item.func].calls
			}))*/
			if(this.path == 'steal/dev/dev.js' && typeof ABC != 'undefined'){
				var one = 2;
			}
			if(this.path == 'steal/dev/dev.js'){
				ABC = true
			}
		},
		/**
		 * After the script has been loaded and run
		 * 
		 *   - check what else has been stolen, load them
		 *   - mark yourself as complete when everything is completed
		 */
		loaded : function(myqueue){
			//check if jQuery has been loaded
			jQueryCheck();
			
			var defs = defines.slice(0);
			defines = [];
			for(var i =0; i < defs.length; i++){
				defs[i]();
			}
			
			
			//mark yourself as current
			steal.cur(this);
			//consider the case where there is 1 depend, but it's already loaded ...
			File.cur(this.path)//.dir();
			if(!myqueue){
				myqueue = queue.slice(0);
				queue = [];
			}
			
			if(!myqueue.length){
				this.complete();
				return;
			}
			
			var self = this;
			var set = [],
				start = this, // this is who we are listening to
				stel,
				initial = [];
			//now go through what you stole and hook everything up
			each(myqueue, function(i, item){
				stel = steal.fn.make( item );
				self.dependencies.push(stel)
				if(stel.kind === 'file'){
					set.push(stel);
					if(start ===self){ //we are the first files ...
						initial.push(stel)
					}else{
						//stel.dependencies.push(start);
						when(start,"complete",stel,"load") //blah blah
					}
				}else{
					each(set,function(){
						//stel.dependencies.push(this);
						when(this,"complete", stel, "load") // if already complete .. call load
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
					when(this,"complete",self,"complete")
				})
			}else{
				when(stel,"complete",self,"complete")
			}
			var thing = function(item){
				return 	typeof item == 'string' ? item : (
					typeof item == 'function' ? "f()" :
					item.path+(item.func ? " f()" : "") )
			}

			var frag = document.createDocumentFragment(),
				headEl = head();
			each(initial, function(){
				var el = this.load(true);
				//console.log(">>>>>",el&&el.src, this.path);
				if(el){
					frag.appendChild(el)
				}
			});
			headEl.insertBefore( frag, headEl.firstChild );
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
			
			if(this.func){
				//console.log(this.path, this);
				this.func();
				this.loaded();
			}else{
				var self = this;
				//console.log(returnScript,"------------")
				return   writeScript(this.path, {type :"text/javascript"},function(){
					//mark as loaded ...
					self.loaded();
				}, returnScript);
			}

		}

	};
	steal.fn.init.prototype = steal.fn;
	//where the root steal folder is
	steal.root = null;
	//where the page is
	steal.pageDir = null;
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

			} else if ( url == steal.pageDir && !expand ) {

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
		 * Returns true if the file is relative
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
			return this.isLocalAbsolute() ? false : this.domain() != File(window.location.href).domain();
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
		 */
		normalize: function() {

			var current = File.cur().dir(),
				//if you are cross domain from the page, and providing a path that doesn't have an domain
				path = this.path;

			if (/^\/\//.test(this.path) ) { //if path is rooted from steal's root 
				path = this.path.substr(2);

			} else if ( this.relative() || (File.cur().isCrossDomain() && //if current file is on another domain and
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
	/**
	 * @attribute pageDir
	 * @hide
	 * The current page's folder's path.
	 */
	steal.pageDir = File(window.location.href).dir();

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
	 * <ul>
	 *    <li><code>steal.options.startFile</code> - the first file steal loads.  This file
	 *    loads all other scripts needed by your application.</li>
	 *    <li><code>steal.options.env</code> - the environment (development or production)
	 *     that determines if steal loads your all your script files or a single
	 *     compressed file.
	 *    </li>
	 * </ul>
	 * <p><code>steal.options</code> can be configured by:</p>
	 * <ul>
	 *    <li>The steal.js script tag in your page (most common pattern).</li>
	 *    <li>An existing steal object in the window object</li>
	 *    <li><code>window.location.hash</code></li>
	 * </ul>
	 * <p>
	 *    The steal.js script tag is by far the most common approach. 
	 *    For the other methods,
	 *    check out [steal.static.options] documentation.
	 *    To load <code>myapp/myapp.js</code> in development mode, your 
	 *    script tag would look like:
	 * </p>
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
		first = true,
		//If we haven't steald a file yet
		first_wave_done = false,
		//a list of all steald paths
		cwd = '',
		//  the current steal
		cur = null,
		//where we are currently including
		steals = [],
		//    
		current_steals = [],
		//steals that are pending to be steald
		total = []; //
	
	extend(steal, {
		when : when,
		/**
		 * Sets options from script
		 * @hide
		 */
		setScriptOptions: function() {
			var scripts = document.getElementsByTagName("script"),
				scriptOptions, commaSplit, stealReg = /steal\.(production\.)?js/;

			//find the steal script and setup initial paths.
			for ( var i = 0; i < scripts.length; i++ ) {
				var src = scripts[i].src;
				if ( src && stealReg.test(src) ) { //if script has steal.js
					var mvc_root = File(File(src).joinFrom(steal.pageDir)).dir(),
						loc = /\.\.$/.test(mvc_root) ? mvc_root + '/..' : mvc_root.replace(/steal$/, '');

					if (/.+\/$/.test(loc) ) {
						loc = loc.replace(/\/$/, '');
					}

					if (/steal\.production\.js/.test(src) ) {
						steal.options.env = "production";
					}
					steal.root = File(loc);
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
						steal.options[prop] = val;
					});
				} else {
					//set with comma style
					commaSplit = scriptOptions.split(",");
					if ( commaSplit[0] && commaSplit[0].lastIndexOf('.js') > 0 ) {
						steal.options.startFile = commaSplit[0];
					} else if ( commaSplit[0] ) {
						steal.options.app = commaSplit[0];
					}
					if ( commaSplit[1] && steal.options.env != "production" ) {
						steal.options.env = commaSplit[1];
					}
				}

			}

		},
		setOldIncludeOptions: function() {
			extend(steal.options, oldsteal);
		},
		setHashOptions: function() {
			window.location.hash.replace(/steal\[(\w+)\]=(\w+)/g, function( whoe, prop, val ) {
				steal.options[prop] = val;
			});
		},
		/**
		 * Starts including files, sets options.
		 * @hide
		 */
		init: function() {
			this.setScriptOptions();
			//force into development mode to prevent errors
			//if ( steal.browser.rhino ) {
			//	steal.options.env = 'development';
			//}
			this.setOldIncludeOptions();
			this.setHashOptions();
			//clean up any options
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
					first = false; //makes it so we call close after
					//steal(steal.options.startFile);
					steal({
						path: steal.options.production,
						force: true
					});
				}

			} else {

				var current_path = File.cur();
				steal({
					path: 'steal/dev/dev.js',
					ignore: true
				});
				File.cur(current_path);




				//if you have a startFile load it
				if ( steal.options.startFile ) {
					first = false; //makes it so we call close after
					//steal(steal.options.startFile);
					steal(steal.options.startFile)
					//steal._start = new steal.fn.init(steal.options.startFile);
					//steal.queue(steal._start);
				}

			}



			//if ( steal.options.startFile ) {
			//	steal.start();
			//}
		},
		cur: function( file ) {
			if ( file !== undefined ) {
				return cur = (typeof file == 'string' ? new steal.fn.init(file) : file);
			} else {
				return cur;
			}
		},
		defined: function(name){
			//get other steals
			//basically create each one ... mark it as loading
			//  load each one
			var stel = steal.fn.make( name );
			stel.loading = true;
			//console.log("  DEF     "+stel.path)
			var myqueue = queue.slice(0);
			queue = [];
			//an array to say each has 'loaded'
			defines.push(function(){
				//print("  loaded with "+stel.path+" queue "+myqueue.length)
				stel.loaded(myqueue)
			});
			return steal;
		},
		done: function(ob, cb) {
			if(typeof ob == 'function' && !cb){
				ob = {
					func: ob
				}
				cb = 'func'
			}
			when(init, "complete", ob,cb)
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
			for(var i =0; i < arguments.length; i++){
				steal({
					path : arguments[i]+".css",
					load : this.cssLoad
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
			var self = this;
			setTimeout(function(){
				self.loaded();
			},0);
			return steal.createLink(src);
		},
		/**
		 * Creates a css link and appends it to head.
		 * @hide
		 * @param {Object} location
		 * @return {HTMLLinkElement}
		 */
		createLink: function( location, options ) {
			options = options || {};
			var link = document[STR_CREATE_ELEMENT]('link');
			link.rel = options.rel || "stylesheet";
			link.href = location;
			link.type = options.type || 'text/css';
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
		then: steal,
		total: total
	});
	var appendMapping = function(p){
		// go through mappings
		for(var map in steal.mappings){
			// first x characters of map match first x characters of p
			if(p.indexOf(map) == 0){
				return p.replace(map, steal.mappings[map]);
			}
		}
		return p;
	}
	var stealPlugin = function( p ) {
		var prefix = appendMapping(p);
		var firstPath = /^(http|\/)/.test(prefix) ? "": "//";
		var path = firstPath + prefix + '/' + getLastPart(prefix);
		return steal(path);
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
		timers: {},
		//tracks the last script
		ct: function( id ) { //for clear timer
			clearTimeout(steal.timers[id]);
			delete steal.timers[id];
		},
		loadErrorTimer: function( options ) {
			var count = ++steal.timerCount;
			steal.timers[count] = setTimeout(function() {
				throw "steal.js Could not load " + options.src + ".  Are you sure you have the right path?";
			}, 5000);
			return "onLoad='steal.ct(" + count + ")' ";
		},
		cleanId: function( id ) {
			return id.replace(/[\/\.]/g, "_");
		},
		startjQuery : function(){
			if (jQueryIncremented) {
                jQuery.readyWait -= 1;
                jQueryIncremented = false;
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
	
	addEvent(window, "load", function(){
		steal.windowloaded();
	});
	steal.windowloaded = function(){};
	steal.bothloaded = function(){
		
	};

	when(init, "complete", steal,"bothloaded");
	when(steal,"windowloaded",steal,"bothloaded");

	steal.load = function(ob, cb) {
		if(typeof ob == 'function' && !cb){
			ob = {
				func: ob
			}
			cb = 'func'
		}
		when(steal, "bothloaded", ob,cb)
	}
	var jQueryIncremented = false;
	
	function jQueryCheck() {
        //if (!window.jQuery) {
            var $ = typeof jQuery !== "undefined" ? jQuery : null;
            if ($ && "readyWait" in $) {
                
                //Increment jQuery readyWait if ncecessary.
                if (!jQueryIncremented) {
                    $.readyWait += 1;
                    jQueryIncremented = true;
                }
            }
        //}
    }
	//onload decrement
})();
