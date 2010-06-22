/*
 * JavaScriptMVC - steal
 * (c) 2010 Jupiter ITS
 * 
 * 
 * This file does the following:
 * 
 * -Checks if the file has already been loaded, if it has, calls steal.end
 * -Defines File
 * -Inspects the DOM for the script tag that steald steal.js, with it extracts:
 *     * the location of steal
 *     * the location of the application directory
 *     * the application's name
 *     * the environment (development, production)
 * -Defines steal
 * -Loads more files depending on environment
 *     * Development -> load the application file
 *     * Production -> Load the application's production file.
 */

//put everything in function to keep space clean
(function(){

if(typeof steal != 'undefined' && steal.nodeType)
	throw("Include is defined as function or an element's id!");






var oldsteal = window.steal;


/**
 * @class steal
 * @tag core
 * <p>Steal does JavaScript dependency management and compression super easy.</p>
 * <p>This page details the use of the steal script (<code>steal/steal.js</code>), 
 * which is the primary tool used to load files into your page.  Here's a quick example:</p>
 * 
 * <h3>Example</h3>
 * <p>Loads the steal script and tells it the first file to load:</p>
 * </p>
 * @codestart html
&lt;script type='text/javascript'
 *        src='path/to/steal.js?<u><b>myapp/myapp.js</b></u>'>&lt;/script>
 * @codeend

 * <p>In the file (<code>myapp/myapp.js</code>), 
 * 'steal' all other files that you need like:</p>
 * @codestart
 * steal.plugins('jquery/controller',     //steals plugins and dependencies
 *           'jquery/controller/view',
 *           'jquery/view',
 *           'jquery/model')
 *  .models('recipe')                     //steals files in the plugin's models folder
 *  .controllers('recipe')                //steals files in the plugin's controllers folder
 *  .resources('i18n')                    //steals files in the plugin's resources folder
 *  .then('//path/to/file')               //steals files with paths relative to project's root
 *  .views('//cookbook/views/recipe/show.ejs') //loads and caches a view file
 *  .then(function(){                     //runs function after prior steals have finished
 *     ...
 * })
 * @codeend
<p>Finally compress your page's JavaScript with:</p>
@codestart
> js steal/compress.js path/to/mypage.html
@codeend
 * <h2>Use</h2>
Use of steal.js is typically broken into 3 parts:
<ul>
	<li>Loading steal.js and setting [steal.static.options]</li>
	<li>"Stealing" scripts</li>
	<li>Compressing a page</li>
</ul>
<div class='whisper'>
NOTE: You can compress pages that don't use steal.js.  
</div>

<h3>Loading <code>steal.js</code> and Setting <code>steal.options</code></h3>

<p>[steal.static.options] is used to configure where and how steal starts loading scripts.
	There are are a lot of options and a lot of ways to set them.  This is covered in 
	the [steal.static.options] documentation.  Here we'll focus on what 95% of what people do -
	setting the startFile and the env with the steal.js script tag.  This looks like:
</p>
@codestart html
&lt;script type='text/javascript'
	   src='path/to/steal.js?<u><b>myapp/myapp.js</b></u>,<u><b>development</b></u>'>
&lt;/script>
@codeend
This sets ...
@codestart
steal.options.startFile = 'myapp/myapp.js'
steal.options.env = 'development'
@codeend

... and results in steal loading 
<code>myapp/myapp.js</code>.
The <code>myapp.js</code> file is commonly referred to as the <b>"application file"</b>.</p>
<p>
	If <code>development</code> changes to <code>production</code>
	steal will load <code>myapp/production.js</code>.
</p>
<div class='whisper'>
	TIP: If startFile doesn't end with <code>.js</code> (ex: myapp), steal assumes
	you are using JavaScriptMVC's folder pattern and will load:
	<code>myapp/myapp.js<code> just to save you 9 characters.
</div>
<h3>Stealing Scripts</h3>
In your files, use the steal function and its helpers
 to load dependencies then describe your functionality.
Typically, most of the 'stealing' is done in your application file.  Loading 
jQuery and jQuery.UI from google, a local helpers.js 
and then adding tabs might look something like this:
@codestart
steal("http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js",
	  "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.0/jquery-ui.js",
	  'helpers')
.then(function(){
	$("#tabs").tabs();
});
@codeend
There's a few things to notice:
<ul>
	<li>the steal function can take multiple arguments</li>
	<li>steal can load cross domain</li>
	<li>steal loads relative to the current file</li>
	<li>steal adds .js if not present</li>
	<li>steal is chainable (most function return steal)</li>
</ul>
<p>
	steal
</p>
 * <h2>How it works</h2>
 * 
 * 
 * Includes are performed relative to the including file. 
 * Files are steald last-in-first-out after the current file has been loaded and run.
 * <h2>Concat and Compress</h2>
 * In your terminal simply run:
 * @codestart no-highlight
 * steal\js APP_NAME\scripts\compress.js
 * @codeend
 * This will generate a production.js bundle in APP_NAME\production.js
 * @codestart no-highlight
 * steal\js APP_NAME\scripts\compress.js
 * @codeend
 * This will generate a production.js bundle in APP_NAME\production.js
 * <h2>Compressing non-JMVC javascript applications.</h2>
 * You can compress and package non-jmvc javascript applications by declaring your scripts
 * this way in your html page:
 * @codestart no-highlight
 * &lt;script src="file1.js" type="text/javascript" compress="true" package="production.js">&lt;/script>
 * &lt;script src="file2.js" type="text/javascript" compress="true" package="production.js">&lt;/script>		
 * @codeend
 * and then running either:
 * @codestart no-highlight
 * steal/js steal/compress.js path\to\non\jmvc\app\PAGE.html [OUTPUT_FOLDER]
 * @codeend 
 * or: 
 * @codestart no-highlight
 * steal/js steal/compress.js http://hostname/path/to/non/jmvc/app/PAGE.html [OUTPUT_FOLDER]
 * @codeend  
 * This will compress file1.js and file2.js into a file package named production.js an put it in OUTPUT_FOLDER.
 * <h2>Run in production</h2>
 * Switch to the production mode by changing development to production:
 * @codestart no-highlight
 * &lt;script src="<i>PATH/TO/</i>steal/steal.js?steal[app]=APP_NAME&steal[env]=production" type="text/javascript">
 * &lt;/script>
 * @codeend
 * Your application will now only load steal.js and production.js, greatly speeding up load time.
 * <h2>Script Load Order</h2>
 * The load order for your scripts follows a consistent last-in first-out order across all browsers. 
 * This is the same way the following document.write would work in msie, Firefox, or Safari:
 * @codestart
 * document.write('&lt;script type="text/javascript" src="some_script.js"></script>')
 * @codeend
 * An example helps illustrate this.<br/>
 * <img src='http://wiki.javascriptmvc.com/images/last_in_first_out.png'/>
 * <table class="options">
				<tr class="top">
					<th>Load Order</th>
					<th class="right">File</th>
				</tr>
				<tbody>
				<tr>
					<td>1</td>
					<td class="right">1.js</td>
				</tr>
				<tr>
					<td>2</td>
					<td class="right">3.js</td>
				</tr>
				<tr>
					<td>3</td>
					<td class="right">4.js</td>
				</tr>
				<tr>
					<td>4</td>
					<td class="right">2.js</td>
				</tr>
				<tr>
					<td>5</td>
					<td class="right">5.js</td>
				</tr>
				<tr class="bottom">
					<td>6</td>
					<td class="right">6.js</td>
				</tr>
	</tbody></table>
 */
steal = function(){
	for(var i=0; i < arguments.length; i++) 
		steal.add(  new steal.fn.init(arguments[i]) );


	return steal;
};

(function(){
	var eventSupported = function( eventName, tag ) { 
		var el = document.createElement(tag); 
		eventName = "on" + eventName; 

		var isSupported = (eventName in el); 
		if ( !isSupported ) { 
			el.setAttribute(eventName, "return;"); 
			isSupported = typeof el[eventName] === "function"; 
		} 
		el = null; 
		return isSupported; 
	};
	steal.support = {
		load : eventSupported("load","script"),
		readystatechange : eventSupported("readystatechange","script"),
		error: eventSupported("readystatechange","script")
	}
})();

var id = 0;
/* @prototype */
steal.fn = steal.prototype = {
	/**
	 * Queues a file to be loaded or an steal callback to be run.  This takes the same arguments as [steal].
	 * @param {String|Object|Function} options 
	 * <table class='options'>
	 *     <tr>
	 *         <th>Type</th><th>Description</th>
	 *     </tr>
	 *     <tr><td>String</td><td>A relative path to a JavaScript file.  The path can optionally end in '.js'</td></tr>
	 *     <tr><td>Object</td>
	 *     <td>An Object with the following properties:
	 *         <ul>
	 *             <li>path {String} - relative path to a JavaScript file.  </li>
	 *             <li>type {optional:String} - Script type (defaults to text/javascript)</li>
	 *             <li>skipInsert {optional:Boolean} - Include not added as script tag</li>
	 *             <li>compress {optional:String} - "false" if you don't want to compress script</li>
	 *             <li>package {optional:String} - Script package name (defaults to production.js)</li>             
	 *         </ul>
	 *     </td></tr>
	 *     <tr><td>Function</td><td>A function to run after all the prior steals have finished loading</td></tr>
	 * </table>
	 * @return {steal} a new steal object
	 */
	init : function(options){
		this.id = (++id)
		if(typeof options == 'function'){
			var path = steal.getCurrent();
			this.path = path;
			this.func = function(){
				steal.setCurrent(path);
				options(steal.send || window.jQuery || steal); //should return what was steald before 'then'
			};
			this.options = options;
		} else if(options.type) { 
			extend( this, options)
			this.path = options.src;
			this.type = options.type;
			this.options = options;
		} else { //something we are going to steal and run
			
			if(typeof options == 'string' ){
				this.path = /\.js$/ig.test(options) ? options : options+'.js'
			}else {
				extend( this, options);
				this.options = options;
			}
			this.originalPath = this.path;
			//get actual path
			var pathFile = new File(this.path);
			this.path = pathFile.normalize();
			this.absolute = pathFile.relative() ? pathFile.joinFrom(steal.getAbsolutePath(), true) : this.path;
			this.dir = new File(this.path).dir();
		}
		
	},
	/**
	 * Adds a script tag to the dom, loading and running the steal's JavaScript file.
	 * @hide
	 */
	run : function(){
		steal.current = this;		
		var isProduction = (steal.options.env == "production");
		
		var options = extend({
			type: "text/javascript",
			compress: "true",
			"package": "production.js"
		}, extend({src: this.path}, this.options));
		
		if(this.func){
			//run function and continue to next steald
			this.func();
			steal.end();
			//insert();
		}else if(this.type){
			isProduction ? true : insert(options);
		}else{
			if(isProduction){
				 return;
			}
			steal.setCurrent(this.path);
			  this.skipInsert ? insert() : insert(options);			  
		}
	},
	/**
	 * Loads the steal code immediately.  This is typically used after DOM has loaded.
	 * @hide
	 */
	runNow : function(){
		steal.setCurrent(this.path);
		
		return browser.rhino ? load(this.path) : 
					steal.insert_head( steal.root.join(this.path) );
	}
	
}
steal.fn.init.prototype = steal.fn;


var extend = function(d, s) { for (var p in s) d[p] = s[p]; return d;},
	getLastPart = function(p){ return p.match(/[^\/]+$/)[0]};
steal.extend = extend;
var browser = {
		msie:     !!(window.attachEvent && !window.opera),
		opera:  !!window.opera,
		safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
		firefox:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
		mobilesafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
		rhino : navigator.userAgent.match(/Rhino/) && true
	}
	steal.browser = browser;
var random = ""+parseInt(Math.random()*100)


steal.root = null;
steal.pageDir = null;


var factory = function(){ return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();};



/**
 * @Constructor
 * Used for getting information out of a path
 * @init
 * Takes a path
 * @param {String} path 
 */
steal.File = function(path){ this.path = path; };
var File = steal.File;
File.prototype = 
/* @prototype */
{
	/**
	 * Removes hash and params
	 * @return {String}
	 */
	clean: function(){
		return this.path.match(/([^\?#]*)/)[1];
	},
	/**
	 * Returns everything before the last /
	 */
	dir: function(){
		var last = this.clean().lastIndexOf('/');
		var dir = (last != -1) ? this.clean().substring(0,last) : ''; //this.clean();
		var parts = dir != '' && dir.match( /^(https?:\/|file:\/)$/ );
		return parts && parts[1] ? this.clean() : dir;
	},
	/**
	 * Returns the domain for the current path.
	 * Returns null if the domain is a file.
	 */
	domain: function(){ 
		if(this.path.indexOf('file:') == 0 ) return null;
		var http = this.path.match(/^(?:https?:\/\/)([^\/]*)/);
		return http ? http[1] : null;
	},
	protocol : function(){
		  return this.path.match( /^(https?:|file:)/ )[1]
	},
	/**
	 * Joins url onto path
	 * @param {Object} url
	 */
	join: function(url){
		return new File(url).joinFrom(this.path);
	},
	/**
	 * Returns the path of this file referenced from another url.
	 * @codestart
	 * new steal.File('a/b.c').joinFrom('/d/e')//-> /d/e/a/b.c
	 * @codeend
	 * @param {Object} url
	 * @param {Object} expand
	 * @return {String} 
	 */
	joinFrom: function( url, expand){
		if(this.isDomainAbsolute()){
			var u = new File(url);
			if(this.domain() && this.domain() == u.domain() ) 
				return this.afterDomain();
			else if(this.domain() == u.domain()) { // we are from a file
				return this.toReferenceFromSameDomain(url);
			}else
				return this.path;
		}else if(url == steal.pageDir && !expand){
			return this.path;
		}else if(this.isLocalAbsolute()){
			var u = new File(url);
			if(!u.domain()) return this.path;
			return u.protocol()+"//"+u.domain() + this.path;
		}
		else{
			
			if(url == '') return this.path.replace(/\/$/,'');
			var urls = url.split('/'), paths = this.path.split('/'), path = paths[0];
			if(url.match(/\/$/) ) urls.pop();
			while(path == '..' && paths.length > 0){
				paths.shift();
				urls.pop();
				path =paths[0];
			}
			return urls.concat(paths).join('/');
		}
	},
	/**
	 * Joins the file to the current working directory.
	 */
	joinCurrent: function(){
		return this.joinFrom(steal.getCurrentFolder());
	},
	/**
	 * Returns true if the file is relative
	 */
	relative: function(){        return this.path.match(/^(https?:|file:|\/)/) == null;},
	/**
	 * Returns the part of the path that is after the domain part
	 */
	afterDomain: function(){    return this.path.match(/https?:\/\/[^\/]*(.*)/)[1];},
	/**
	 * Returns the relative path between two paths with common folders.
	 * @codestart
	 * new steal.File('a/b/c/x/y').toReferenceFromSameDomain('a/b/c/d/e')//-> ../../x/y
	 * @codeend
	 * @param {Object} url
	 * @return {String} 
	 */
	toReferenceFromSameDomain: function(url){
		var parts = this.path.split('/'), other_parts = url.split('/'), result = '';
		while(parts.length > 0 && other_parts.length >0 && parts[0] == other_parts[0]){
			parts.shift(); other_parts.shift();
		}
		for(var i = 0; i< other_parts.length; i++) result += '../';
		return result+ parts.join('/');
	},
	/**
	 * Is the file on the same domain as our page.
	 */
	isCrossDomain : function(){
		if(this.isLocalAbsolute()) return false;
		return this.domain() != new File(window.location.href).domain();
	},
	isLocalAbsolute : function(){    return this.path.indexOf('/') === 0},
	isDomainAbsolute : function(){return this.path.match(/^(https?:|file:)/) != null},
	/**
	 * For a given path, a given working directory, and file location, update the path so 
	 * it points to the right location.
	 * This should probably folded under joinFrom
	 */
	normalize: function(){
		
		var current_path = steal.getCurrentFolder();
		//if you are cross domain from the page, and providing a path that doesn't have an domain
		var path = this.path;
		
		if (/^\/\//.test(this.path)) {
			
			path = this.path.substr(2);
		}else if (this.isCurrentCrossDomain() && !this.isDomainAbsolute()) {
			//if the path starts with /
			
			path = this.isLocalAbsolute() ? 
				current_path.split('/').slice(0, 3).join('/') + path :
				this.joinFrom(current_path);
				
		} else if (current_path != '' && this.relative()) {
			
			path = this.joinFrom(current_path + (current_path.lastIndexOf('/') === current_path.length - 1 ? '' : '/'));
		
		} 
		return path;
	},
	isCurrentCrossDomain : function(){
		return new File(steal.getAbsolutePath()).isCrossDomain();
	}
};
/**
 *  @add steal
 */
// break
/* @static */
//break
/**
 * @attribute pageDir
 * The current page's folder's path.
 */
steal.pageDir = new File(window.location.href).dir();

//find steal


/**
 * @attribute options
 * Options that deal with steal
 * <table class='options'>
	 *     <tr>
	 *         <th>Option</th><th>Default</th><th>Description</th>
	 *     </tr>
	 *     <tr><td>env</td><td>development</td><td>Which environment is currently running</td></tr>
	 *     <tr><td>encoding</td><td>utf-8</td><td>What encoding to use for script loading</td></tr>
	 *     <tr><td>cacheInclude</td><td>true</td><td>true if you want to let browser determine if it should cache script; false will always load script</td></tr>
	 *     <tr><td>debug</td><td>true</td><td>turns on debug support</td></tr>
	 *     <tr><td>done</td><td>null</td><td>If a function is present, calls function when all steals have been loaded</td></tr>
	 *     <tr><td>documentLocation</td><td>null</td><td>If present, ajax request will reference this instead of the current window location.  
	 *     Set this in run_unit, to force unit tests to use a real server for ajax requests. </td></tr>
	 *     <tr><td>startFile</td><td>null</td><td>This is the first file to load.  It is typically determined from the first script option parameter 
	 *     in the inclue script. </td></tr>
	 * </table>
<ul>
	<li><code>steal.options.startFile</code> - the first file steal loads.  This file
	loads all other scripts needed by your application.</li>
	<li><code>steal.options.env</code> - the environment (development or production)
		that determines if steal loads your all your script files or a single
		compressed file.
	</li>
</ul>
<p><code>steal.options</code> can be configured by:</p>
<ul>
	<li>The steal.js script tag in your page (most common pattern).</li>
	<li>An existing steal object in the window object</li>
	<li><code>window.location.hash</code></li>
</ul>
<p>
	The steal.js script tag is by far the most common approach. 
	For the other methods,
	check out [steal.static.options] documentation.
	To load <code>myapp/myapp.js</code> in development mode, your 
	script tag would look like:
</p>

@codestart
&lt;script type='text/javascript'
		src='path/to/steal.js?<u><b>myapp/myapp.js</b></u>,<u><b>development</b></u>'>
&lt;/script>
@codeend
<div class='whisper'>
Typically you want this script tag right before the closing body tag (<code>&lt;/body></code>) of your page.
</div>
<p>Note that the path to <code>myapp/myapp.js</code> 
is relative to the 'steal' folder's parent folder.  This
is typically called the JavaScriptMVC root folder or just root folder if you're cool.</p>
<p>And since JavaScriptMVC likes folder structures like:</p>
@codestart text
\myapp
	\myapp.js
\steal
	\steal.js
@codeend
<p>If your path doesn't end with <code>.js</code>, JavaScriptMVC assumes you are loading an 
application and will add <code>/myapp.js</code> on for you.  This means that this does the same thing too:</p>
@codestart
&lt;script type='text/javascript'
 *        src='path/to/steal.js?<u><b>myapp</b></u>'>&lt;/script>
@codeend
<div class='whisper'>Steal, and everything else in JavaScriptMVC, provide these little shortcuts
when you are doing things 'right'.  In this case, you save 9 characters 
(<code>/myapp.js</code>) by organizing your app the way, JavaScriptMVC expects.</div>
</div>
 */
steal.options = {
	loadProduction: true,
	env: 'development',
	production:null,
	encoding : "utf-8",
	cacheInclude : true,
	debug: true
}





// variables used while including
var first = true ,                                 //If we haven't steald a file yet
	first_wave_done = false,                       //If all files have been steald 
	steald_paths = [],                             //a list of all steald paths
	cwd = '',                                      //where we are currently including
	steals=[],                                     //    
	current_steals=[],                             //steals that are pending to be steald
	total = [];                                    //







extend(steal,
{
	/**
	 * Sets options from script
	 * @hide
	 */
	setScriptOptions : function(){
		var scripts = document.getElementsByTagName("script"), 
			scriptOptions, 
			commaSplit;
		for(var i=0; i<scripts.length; i++) {
			var src = scripts[i].src;
			if(src && src.match(/steal\.js/)){  //if script has steal.js
				var mvc_root = new File( new File(src).joinFrom( steal.pageDir ) ).dir();
				var loc = mvc_root.match(/\.\.$/) ?  mvc_root+'/..' : mvc_root.replace(/steal$/,'');
				if(loc.match(/.+\/$/)) loc = loc.replace(/\/$/, '');

				steal.root = new File(loc);
				if(src.indexOf('?') != -1) scriptOptions = src.split('?')[1];
			}
		
		}
		
		if(scriptOptions){
			if(scriptOptions.indexOf('=') > -1){
				scriptOptions.replace(/steal\[([^\]]+)\]=([^&]+)/g, function(whoe, prop, val){ 
					steal.options[prop] = val;
				})
			}else{
				commaSplit = scriptOptions.split(",")
				if(commaSplit[0]&& commaSplit[0].lastIndexOf('.js' )> 0 ){
					steal.options.startFile = commaSplit[0];
				}else if(commaSplit[0]){
					steal.options.app = commaSplit[0];
				}
				steal.options.env = commaSplit[1];
			}
			
		}
		
	},
	setOldIncludeOptions : function(){
		extend(steal.options, oldsteal);
	},
	setHashOptions : function(){
		window.location.hash.replace(/steal\[(\w+)\]=(\w+)/g, function(whoe, prop, val){ 
			steal.options[prop] = val;
		})
	},
	/**
	 * Starts including files, sets options.
	 * @hide
	 */
	init: function(){
		this.setScriptOptions();
		this.setOldIncludeOptions();
		this.setHashOptions();
		//clean up any options
		if(steal.options.app){
			steal.options.startFile = steal.options.app+"/"+steal.options.app.match(/[^\/]+$/)[0]+".js"
		}
		if(steal.options.ignoreControllers){
			steal.controllers = function(){return steal;}
			steal.controller = function(){return steal;}
		}
		
		
		if(!steal.options.production && steal.options.startFile){
			steal.options.production = steal.root.join(  new File(steal.options.startFile).dir()+ '/production')

		}
		if(steal.options.production)
			steal.options.production = steal.options.production+(steal.options.production.indexOf('.js') == -1 ? '.js' : '' );
		
		//start loading stuff
		//steal.plugins('jquery'); //always load jQuery
		var current_path = steal.getCurrent();
		steal({
			path: 'steal/dev/dev.js',
			ignore: true
		})
		steal.setCurrent(current_path);

		   
		
		
		//if you have a startFile load it
		if(steal.options.startFile){
			first = false; //makes it so we call close after
			steal(steal.options.startFile);
		}
		if(steal.options.env == 'test')  {
			steal.plugins('test');
			if(steal.options.documentLocation) 
				steal.plugins('dom/fixtures/overwrite');
			if(steal.options.startFile){ //load test file in same directory
				 steal( new File(steal.options.startFile).dir()+"/test/unit.js");
			}
		}

		if(steal.options.env == 'production' && steal.options.loadProduction){
			steal.end()
			document.write('<script type="text/javascript" src="'+steal.options.production+'"></script>' );
			return
		}
			
			
		if(steal.options.startFile) steal.start();
	},
	/**
	 * Gets the current directory your relative steals will reference.
	 * @return {String} the path of the current directory.
	 */
	getCurrentFolder: function() {
		var fwd = new File(cwd);
		return fwd.dir();
	},
	/**
	 * Sets the current directory.
	 * @param {String} p the new directory which relative paths reference
	 */
	setCurrent: function(p){
		cwd = p
	},
	getCurrent: function(){
		return cwd;
	},
	getAbsolutePath: function(){
		var dir = this.getCurrentFolder(), 
			fwd = new File(this.getCurrentFolder());
		return fwd.relative() ? fwd.joinFrom(steal.root.path, true) : dir;
	},
	// Adds an steal to the pending list of steals.
	add: function(newInclude){
		//If steal is a function, add to list, and unshift
		if(typeof newInclude.func == 'function'){
			steal.functions.push(newInclude); //add to the list of functions
			current_steals.unshift(  newInclude ); //add to the front
			return;
		}
		
		//if we have already performed loads, insert new steals in head
		

		//now we should check if it has already been steald or added earlier in this file
		if(steal.should_add(newInclude)){
			if(first_wave_done) {
				return newInclude.runNow();
			}
			//but the file could still be in the list of steals but we need it earlier, so remove it and add it here
			var path = newInclude.absolute || newInclude.path;
			for(var i = 0; i < steals.length; i++){
				if(steals[i].absolute == path){
					steals.splice(i,1);
					break;
				}
			} 
			current_steals.unshift(  newInclude );
		}
	},
	//
	should_add : function(inc){
		var path = inc.absolute || inc.path;
		for(var i = 0; i < total.length; i++) if(total[i].absolute == path) return false;
		for(var i = 0; i < current_steals.length; i++) if(current_steals[i].absolute == path) return false;
		return true;
	},
	done : function(){
		if (typeof steal.options.done == "function") steal.options.done(total);
	},
	// Called after every file is loaded.  Gets the next file and steals it.
	end: function(src){
		//prevents warning of bad includes
		clearTimeout(steal.timer)
		// add steals that were just added to the end of the list
		var got = current_steals.length;
		steals = steals.concat(current_steals);
		if (!steals.length) return;
		
		// take the last one
		var next = steals.pop();
				
		// if there are no more
		if(!next) {
			first_wave_done = true;
			steal.done();
		}else{
			//add to the total list of things that have been steald, and clear current steals
			total.push( next);
			current_steals = [];
			next.run();
		}
		
	},
	//steal.end_of_production is written at the end of the production script to call this function
	end_of_production: function(){ first_wave_done = true;steal.done(); },
	
	/**
	 * Starts loading files.  This is useful when steal is being used without providing an initial file or app to load.
	 * You can steal files, but then call steal.start() to start actually loading them.
	 * 
	 * <h3>Example:</h3>
	 * @codestart html
	 * &lt;script src='steal/steal.js'>&lt;/script>
	 * &lt;script type='text/javascript'>
	 *    steal.plugins('controller')
	 *    steal.start();
	 * &lt;/script>
	 * @codeend
	 * The above code loads steal, then uses steal to load the plugin controller.
	 */
	start: function(){
		steal.start_called = true;
		steal.end();
	},
	start_called : false,
	functions: [],
	next_function : function(){
		var func = steal.functions.pop();
		if(func) func.func();
	},
	/**
	 * Includes CSS from the stylesheets directory.
	 * @hide
	 * @param {String} css the css file's name to load, steal will add .css.
	 */
	css: function(){
		var arg;
		for(var i=0; i < arguments.length; i++){
			arg = arguments[i];
			steal.css_rel('../../stylesheets/'+arg);
		}
	},
	/**
	 * Creates css links from the given relative path.
	 * @hide
	 * @param {String} relative URL(s) to stylesheets
	 */
	css_rel: function(){
		var arg;
		for(var i=0; i < arguments.length; i++){
			arg = arguments[i];
			var current = new File(arg+".css").joinCurrent();
			steal.create_link( steal.root.join(current)  );
		}
	},
	/**
	 * Creates a css link and appends it to head.
	 * @hide
	 * @param {Object} location
	 */
	create_link: function(location){
		var link = document.createElement('link');
		link.rel = "stylesheet";
		link.href =  location;
		link.type = 'text/css';
		head().appendChild(link);
	},	
	/**
	 * Synchronously requests a file.
	 * @param {String} path path of file you want to load
	 * @param {optional:String} content_type optional content type
	 * @return {String} text of file
	 */
	request: function(path, content_type){
	   var contentType = content_type || "application/x-www-form-urlencoded; charset="+steal.options.encoding
	   var request = factory();
	   request.open("GET", path, false);
	   request.setRequestHeader('Content-type', contentType)
	   if(request.overrideMimeType) request.overrideMimeType(contentType);

	   try{request.send(null);}
	   catch(e){return null;}
	   if ( request.status == 500 || request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return null;
	   return request.responseText;
	},
	/**
	 * Inserts a script tag in head with the encoding.
	 * @hide
	 * @param {Object} src
	 * @param {Object} encode
	 */
	insert_head: function(src, encode, type, text, id){
		encode = encode || "UTF-8";
		var script= script_tag();
		src && (script.src= src);
		script.charset= encode;
		script.type = type ||"text/javascript"
		id && (script.id = id);
		text && (script.text = text);
		head().appendChild(script);
	},
	write : function(src, encode){
		encode = encode || "UTF-8";
		document.write('<script type="text/javascript" src="'+src+'" encode="+encode+"></script>');
	},
	resetApp : function(f){
		return function(name){
			var current_path = steal.getCurrent();
			steal.setCurrent("");
			if(name.path){
				name.path = f(name.path)
			}else{
				name = f(name)
			}
			steal(name);
			steal.setCurrent(current_path);
			return steal;
		}
	},
	callOnArgs : function(f){
		return function(){
			for(var i=0; i < arguments.length; i++) f(arguments[i]);
			return steal;
		}
		
	},
	// Returns a function that applies a function to a list of arguments.  Then steals those
	// arguments.
	applier: function(f){
		return function(){
			for (var i = 0; i < arguments.length; i++) {
				arguments[i] = f(arguments[i]);
			}
			steal.apply(null, arguments);
			return steal;
		}
	},
	log : function(){
		$('#log').append(jQuery.makeArray(arguments).join(", ")+"<br/>")
	},
	then : steal,
	total: total
});
steal.plugin = steal.resetApp(function(p){return p+'/'+getLastPart(p)})
/**
 * @function plugins
 * Loads a list of plugins given a path relative to the project's root.
 * @param {String} plugin_location location of a plugin, ex: jquery/dom/history.
 * @return {steal} a new steal object
 * @codestart 
 *  steal.plugins('jquery/controller',
 *                'jquery/controller/view',
 *                'jquery/view',
 *                'jquery/model',
 *                'steal/openajax')
 * @codeend 
 */
steal.plugins = steal.callOnArgs(steal.plugin);


/**
 * @function controllers
 * Includes controllers given the relative path from the plugin's <b>controllers</b> directory.
 * <br>
 * Will add the suffix _controller.js to each name passed in.
 * <br>
 * <br>
 * Example:
 * <br>
 * If you want to include PLUGIN_NAME/controllers/recipe_controller.js and ingredient_controller.js,
 * edit PLUGIN_NAME/PLUGIN_NAME.js file like this:
 * @codestart 
 *  steal.controllers('recipe',
 *                    'ingredient')
 * @codeend
 * @param {String} controller_name A controller to steal.  "_controller.js" is added to the name provided.
 * @return {steal} a new steal object    
 */
steal.controllers = steal.applier(function(i){
	if (i.match(/^\/\//)) {
		i = steal.root.join( i.substr(2) )
		return i;
	}
	return 'controllers/'+i+'_controller';
});

/**
 * @function models
 * Includes models given the relative path from the plugin's <b>models</b> directory.
 * <br>
 * <br>
 * Example:
 * <br>
 * If you want to include PLUGIN_NAME/models/recipe.js and ingredient.js,
 * edit PLUGIN_NAME/PLUGIN_NAME.js file like this:
 * @codestart 
 *  steal.models('recipe',
 *               'ingredient')
 * @codeend
 * @param {String} model_name The name of the model file you want to load.
 * @return {steal} a new steal object   
 */
steal.models = steal.applier(function(i){
	if (i.match(/^\/\//)) {
		i = steal.root.join( i.substr(2) )
		return i;
	}
	return 'models/'+i;
});
 
/**
 * @function resources
 * Includes resources given the relative path from the plugin's <b>resources</b> directory.
 * <br>
 * <br>
 * Example:
 * <br>
 * If you want to include PLUGIN_NAME/resources/i18n.js
 * edit PLUGIN_NAME/PLUGIN_NAME.js file like this:
 * @codestart 
 *  steal.resources('i18n')
 * @codeend
 * @param {String} resource_name The name of the resource file you want to load.
 * @return {steal} a new steal object   
 */
steal.resources = steal.applier(function(i){
	if (i.match(/^\/\//)) {
		i = steal.root.join( i.substr(2) )
		return i;
	}
	return 'resources/'+i;
});

/**
 * @function views
 * Includes views given the view's absolute path from the project's root directory.
 * <br>
 * <br>
 * Example:
 * <br>
 * If you want to include PLUGIN_NAME/views/recipe/show.ejs and list.ejs
 * edit PLUGIN_NAME/PLUGIN_NAME.js file like this:
 * @codestart 
 *  steal.views('//PLUGIN_NAME/views/recipe/show.ejs',
 *              '//PLUGIN_NAME/views/recipe/list.ejs')
 * @codeend
 * @param {String} view_path The view's abolute path.
 * @return {steal} a new steal object    
 */
steal.views = function(){
	// Only includes views for compression and docs (when running in rhino)
	if (browser.rhino || steal.options.env == "production") {
		for (var i = 0; i < arguments.length; i++) {
			steal.view(arguments[i])
		}
	}
	return steal;
};

steal.timerCount = 0;
steal.view = function(path){
	var type = path.match(/\.\w+$/gi)[0].replace(".","");
	steal({src: path, type: "text/"+type, compress: "false"});    
	return steal;
};
steal.timers = {}; //tracks the last script

steal.ct = function(id){ //for clear timer
	clearTimeout(steal.timers[id]);
	delete steal.timers[id]
}
steal.loadErrorTimer = function(options){
	var count = ++steal.timerCount;
	steal.timers[count]=setTimeout(function(){
		throw "steal.js Could not load "+options.src+".  Are you sure you have the right path?"
	},5000);
	return "onLoad='steal.ct("+count+")' "
}
var script_tag = function(){
	var start = document.createElement('script');
	start.type = 'text/javascript';
	return start;
};

var insert = function(options){
	// source we need to know how to get to steal, then load 
	// relative to path to steal

	options = extend({
		id: options.src && options.src.replace(/[\/\.]/g, "_")
	}, options);
	var start= options.src
	if(options.src){
		var src_file = new File(options.src);
		if(!src_file.isLocalAbsolute() && !src_file.isDomainAbsolute())
			options.src = steal.root.join(options.src);
	}

	var text = "";
	if(options.type && options.type != 'text/javascript' && !browser.rhino){
		text = steal.request(options.src);
		if(!text)
			throw "steal.js there is nothing at "+options.src;
		options.text = text;
		delete options.src;
	}

	var scriptTag = '<script ';
	for(var attr in options){
		scriptTag += attr + "='" + options[attr] + "' ";
	}
	if(steal.support.load && !steal.browser.rhino){
		scriptTag += steal.loadErrorTimer(options)
	}
	scriptTag += '></script>';
	if(steal.support.load){
		scriptTag +='<script type="text/javascript">steal.end()</script>'
	}
	else
	{
		scriptTag += '<script type="text/javascript" src="'+steal.root.join('steal/end.js')+'"></script>'
	}
	document.write(
		(options.src? scriptTag : '') 
	);
};


var head = function(){
	var d = document, de = d.documentElement;
	var heads = d.getElementsByTagName("head");
	if(heads.length > 0 ) return heads[0];
	var head = d.createElement('head');
	de.insertBefore(head, de.firstChild);
	return head;
};

steal.init();
})();

