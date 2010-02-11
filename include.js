/*
 * JavaScriptMVC - include
 * (c) 2008 Jupiter ITS
 * 
 * 
 * This file does the following:
 * 
 * -Checks if the file has already been loaded, if it has, calls include.end
 * -Defines the MVC namespace.
 * -Defines File
 * -Inspects the DOM for the script tag that included include.js, with it extracts:
 *     * the location of include
 *     * the location of the application directory
 *     * the application's name
 *     * the environment (development, compress, test, production)
 * -Defines include
 * -Loads more files depending on environment
 *     * Development/Compress -> load the application file
 *     * Test -> Load the test plugin, the application file, and the application's test file
 *     * Production -> Load the application's production file.
 */

//put everything in function to keep space clean
(function(){
    
if(typeof include != 'undefined' && include.nodeType)
    throw("Include is defined as function or an element's id!");

var oldinclude = window.include;


/**
 * @class include
 * @tag core
 * Include is used to:
 * <ul>
 *  <li> easily load and compress your application's JavaScript files.  </li>
 *  <li> switch to a different environment [development, test, compress, production]</li>
 * </ul>
 * <h2>Examples</h2>
 * @codestart
 * include('../../someFolder/somefile');  //includes a JS file relative to the current file
 * include.plugins('controller','view')   //includes plugins and dependancies
 * include.models('task')                 //includes files in models folder
 * include.controller('task')             //includes files in controllers folder
 * include(function(){                    //runs function after prior includes have finished
 *   include.views('views/task/init')     //loads a processed view file
 * })
 * @codeend
 * Includes are performed relative to the including file. 
 * Files are included last-in-first-out after the current file has been loaded and run.
 * <h2>Concat and Compress</h2>
 * In your terminal simply run:
 * @codestart no-highlight
 * js apps\APP_NAME\compress.js
 * @codeend
 * This will generate a production.js bundle in apps\APP_NAME\production.js
 * <h2>Run in production</h2>
 * Switch to the production mode by changing development to production:
 * @codestart no-highlight
 * &lt;script src="<i>PATH/TO/</i>steal/include.js?APP_NAME,production" type="text/javascript">
 * &lt;/script>
 * @codeend
 * Your application will now only load include.js and production.js, greatly speeding up load time.
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
include = function(){
    
    if(include.options.env.match(/development|compress|test/)){
        
        for(var i=0; i < arguments.length; i++) 
            include.add(  new include.fn.init(arguments[i]) );

    }else{
        //production file
        if(!first_wave_done && (typeof arguments[0] != 'function')) return; 
        for(var i=0; i < arguments.length; i++){
            include.add( new include.fn.init(arguments[i]) );
        }
    }
    return include;
};
var id = 0;
/* @prototype */
include.fn = include.prototype = {
    /**
     * Queues a file to be loaded or an include callback to be run.  This takes the same arguments as [include].
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
     *             <li>process {optional:Function} - Function that will process include in compress mode</li>
     *             <li>skipInsert {optional:Boolean} - Include not added as script tag</li>
     *             <li>compress {optional:Boolean} - false if you don't want to compress script</li>
     *         </ul>
     *     </td></tr>
     *     <tr><td>Function</td><td>A function to run after all the prior includes have finished loading</td></tr>
     * </table>
     * @return {include} a new include object
     */
    init : function(options){
        this.id = (++id)
		if(typeof options == 'function'){
            var path = include.getPath();
            this.func = function(){
                include.setPath(path);
                options(window.jQuery); //should return what was included before 'then'
            };
            this.options = options;
        } else if(options.type) { 
            this.path = options.src;
            this.type = options.type;
        } else { //something we are going to include and run
            
            if(typeof options == 'string' ){
                this.path = options.indexOf('.js') == -1  ? options+'.js' : options
            }else {
                extend( this, options)
            }
            this.originalPath = this.path;
            //get actual path
            var pathFile = new File(this.path);
            this.path = pathFile.normalize();
            this.absolute = pathFile.relative() ? pathFile.joinFrom(include.getAbsolutePath(), true) : this.path;
            this.dir = new File(this.path).dir();
        }
        
    },
    /**
     * Adds a script tag to the dom, loading and running the include's JavaScript file.
     * @hide
     */
    run : function(){
        include.current = this;
        if(this.func){
            //run function and continue to next included
            this.func();
            insert();
        }else if(this.type){
        	insert(this.path, "text/" + this.type);
        }else{
            if( include.options.env == 'compress'){
                this.setSrc();
            }
            include.setPath(this.dir);
              this.skipInsert ? insert() : insert(this.path);
        }
    },
    /**
     * Loads the include code immediately.  This is typically used after DOM has loaded.
     * @hide
     */
    runNow : function(){
        include.setPath(this.dir);
        
        return browser.rhino ? load(this.path) : 
                    include.insert_head( include.root.join(this.path) );
    },
    /**
     * Sets the src property for an include.  This is used by compression.
     * @hide
     */
    setSrc : function(){
        if(include.options.debug){
            var parts = this.path.split("/")
            if(parts.length > 4) parts = parts.slice(parts.length - 4);
            print("   "+parts.join("/"));
        }
        this.src = include.request(include.root.join(this.path));
    }
    
}
include.fn.init.prototype = include.fn;


var extend = function(d, s) { for (var p in s) d[p] = s[p]; return d;},
    getLastPart = function(p){ return p.match(/[^\/]+$/)[0]};
include.extend = extend;
var browser = {
        msie:     !!(window.attachEvent && !window.opera),
        opera:  !!window.opera,
        safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
        firefox:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
        mobilesafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
        rhino : navigator.userAgent.match(/Rhino/) && true
    }
    include.browser = browser;
var random = ""+parseInt(Math.random()*100)


include.root = null;
include.pageDir = null;


var factory = function(){ return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();};



/**
 * @Constructor
 * Used for getting information out of a path
 * @init
 * Takes a path
 * @param {String} path 
 */
include.File = function(path){ this.path = path; };
var File = include.File;
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
        return last != -1 ? this.clean().substring(0,last) : ''; //this.clean();
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
     * Returns the path of this file referenced form another url.
     * @codestart
     * new include.File('a/b.c').joinFrom('/d/e')//-> /d/e/a/b.c
     * @codeend
     * @param {Object} url
     * @param {Object} expand
     * @return {String} 
     */
    joinFrom: function( url, expand){
        if(this.isDomainAbsolute()){
            var u = new File(url);
            if(this.domain() && this.domain() == u.domain() ) 
                return this.after_domain();
            else if(this.domain() == u.domain()) { // we are from a file
                return this.to_reference_from_same_domain(url);
            }else
                return this.path;
        }else if(url == include.pageDir && !expand){
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
    join_current: function(){
        return this.joinFrom(include.getPath());
    },
    /**
     * Returns true if the file is relative
     */
    relative: function(){        return this.path.match(/^(https?:|file:|\/)/) == null;},
    /**
     * Returns the part of the path that is after the domain part
     */
    after_domain: function(){    return this.path.match(/(?:https?:\/\/[^\/]*)(.*)/)[1];},
    /**
     * 
     * @param {Object} url
     */
    to_reference_from_same_domain: function(url){
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
    is_cross_domain : function(){
        if(this.isLocalAbsolute()) return false;
        return this.domain() != new File(window.location.href).domain();
    },
    isLocalAbsolute : function(){    return this.path.indexOf('/') === 0},
    isDomainAbsolute : function(){return this.path.match(/^(https?:|file:)/) != null},
    /**
     * For a given path, a given working directory, and file location, update the path so 
     * it points to the right location.
     */
    normalize: function(){
        var current_path = include.getPath();
        //if you are cross domain from the page, and providing a path that doesn't have an domain
        var path = this.path;
        if(new File(include.getAbsolutePath()).is_cross_domain() && !this.isDomainAbsolute() ){
            //if the path starts with /
            if( this.isLocalAbsolute() ){
                var domain_part = current_path.split('/').slice(0,3).join('/');
                path = domain_part+path;
            }else{ //otherwise
                path = this.joinFrom(current_path);
            }
        }else if(current_path != '' && this.relative()){
            path = this.joinFrom( current_path+(current_path.lastIndexOf('/') === current_path.length - 1 ? '' : '/')  );
        }
        return path;
    }
};
/**
 *  @add include
 */
// break
/* @static */
//break
/**
 * @attribute pageDir
 * The current page's folder's path.
 */
include.pageDir = new File(window.location.href).dir();

//find include


/**
 * @attribute options
 * Options that deal with include
 * <table class='options'>
     *     <tr>
     *         <th>Option</th><th>Default</th><th>Description</th>
     *     </tr>
     *     <tr><td>env</td><td>development</td><td>Which environment is currently running</td></tr>
     *     <tr><td>encoding</td><td>utf-8</td><td>What encoding to use for script loading</td></tr>
     *     <tr><td>cacheInclude</td><td>true</td><td>true if you want to let browser determine if it should cache script; false will always load script</td></tr>
     *     <tr><td>debug</td><td>true</td><td>turns on debug support</td></tr>
     *     <tr><td>done</td><td>null</td><td>If a function is present, calls function when all includes have been loaded</td></tr>
     *     <tr><td>documentLocation</td><td>null</td><td>If present, ajax request will reference this instead of the current window location.  
     *     Set this in run_unit, to force unit tests to use a real server for ajax requests. </td></tr>
     *     <tr><td>startFile</td><td>null</td><td>This is the first file to load.  It is typically determined from the first script option parameter 
     *     in the inclue script. </td></tr>
     * </table>
 * 
 * 
 */
include.options = {
    loadProduction: true,
    env: 'development',
    production:null,
    encoding : "utf-8",
    cacheInclude : true,
    debug: true
}





// variables used while including
var first = true ,                                 //If we haven't included a file yet
    first_wave_done = false,                       //If all files have been included 
    included_paths = [],                           //a list of all included paths
    cwd = '',                                      //where we are currently including
    includes=[],                                   //    
    current_includes=[],                           //includes that are pending to be included
    total = [];                                    //







extend(include,
{
    /**
     * Sets options from script
     * @hide
     */
    setScriptOptions : function(){
        var scripts = document.getElementsByTagName("script"), scriptOptions;
        for(var i=0; i<scripts.length; i++) {
            var src = scripts[i].src;
            if(src && src.match(/include\.js/)){  //if script has include.js
                var mvc_root = new File( new File(src).joinFrom( include.pageDir ) ).dir();
                var loc = mvc_root.match(/\.\.$/) ?  mvc_root+'/..' : mvc_root.replace(/steal$/,'');
                if(loc.match(/.+\/$/)) loc = loc.replace(/\/$/, '');
                include.root = new File(loc);
                if(src.indexOf('?') != -1) scriptOptions = src.split('?')[1];
            }
        
        }
        
        if(scriptOptions){
            scriptOptions.replace(/include\[([^\]]+)\]=([^&]+)/g, function(whoe, prop, val){ 
                include.options[prop] = val;
            })
        }
        
    },
    setOldIncludeOptions : function(){
        extend(include.options, oldinclude);
    },
    setHashOptions : function(){
        window.location.hash.replace(/steal\[(\w+)\]=(\w+)/g, function(whoe, prop, val){ 
            include.options[prop] = val;
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
        if(include.options.app){
            include.options.startFile = include.options.app+"/"+include.options.app.match(/[^\/]+$/)[0]+".js"
        }
        
        
        if(!include.options.production && include.options.startFile){
            include.options.production = include.root.join(  new File(include.options.startFile).dir()+ '/production')

        }
        if(include.options.production)
            include.options.production = include.options.production+(include.options.production.indexOf('.js') == -1 ? '.js' : '' );
        
        //start loading stuff
        //include.plugins('jquery'); //always load jQuery
        
        //if you have a startFile load it
        if(include.options.startFile){
            first = false; //makes it so we call close after
            include(include.options.startFile);
        }
        if(include.options.env == 'test')  {
            include.plugins('test');
            if(include.options.documentLocation) 
                include.plugins('dom/fixtures/overwrite');
            if(include.options.startFile){ //load test file in same directory
                 include( new File(include.options.startFile).dir()+"/test/unit.js");
            }
        }
        if(include.options.env == 'compress'){
            include.plugin({path: 'util/compress', ignore: true}) //should get ignored
        }
        if(include.options.env == 'production' && include.options.loadProduction){
            document.write('<script type="text/javascript" src="'+include.options.production+'"></script>' );
            return
        }
            
            
        if(include.options.startFile) include.start();
    },
    /**
     * Sets the current directory.
     * @param {String} p the new directory which relative paths reference
     */
    setPath: function(p) {
        cwd = p;
    },
    /**
     * Gets the current directory your relative includes will reference.
     * @return {String} the path of the current directory.
     */
    getPath: function() { 
        return cwd;
    },
    getAbsolutePath: function(){
        var fwd = new File(cwd);
        return fwd.relative() ? fwd.joinFrom(include.root.path, true) : cwd;
    },
    // Adds an include to the pending list of includes.
    add: function(newInclude){
        //If include is a function, add to list, and unshift
		if(typeof newInclude.func == 'function'){
            include.functions.push(newInclude); //add to the list of functions
            current_includes.unshift(  newInclude ); //add to the front
            return;
        }
        
        //if we have already performed loads, insert new includes in head
        

        //now we should check if it has already been included or added earlier in this file
        if(include.should_add(newInclude)){
            if(first_wave_done) {
                return newInclude.runNow();
            }
            //but the file could still be in the list of includes but we need it earlier, so remove it and add it here
            for(var i = 0; i < includes.length; i++){
                if(includes[i].absolute == newInclude.absolute){
                    includes.splice(i,1);
                    break;
                }
            } 
            current_includes.unshift(  newInclude );
        }
    },
    //
    should_add : function(inc){
        var path = inc.absolute;
        for(var i = 0; i < total.length; i++) if(total[i].absolute == path) return false;
        for(var i = 0; i < current_includes.length; i++) if(current_includes[i].absolute == path) return false;
        return true;
    },
    done : function(){
        if (typeof include.options.done == "function") include.options.done(total);
    },
    // Called after every file is loaded.  Gets the next file and includes it.
    end: function(src){
        // add includes that were just added to the end of the list
		includes = includes.concat(current_includes);
        
        // take the last one
        var next = includes.pop();
        
        // if there are no more
        if(!next) {
            first_wave_done = true;
            include.done();
        }else{
            //add to the total list of things that have been included, and clear current includes
            total.push( next);
            current_includes = [];
            next.run();
        }
        
    },
    //include.end_of_production is written at the end of the production script to call this function
    end_of_production: function(){ first_wave_done = true;include.done(); },
    
    /**
     * Starts loading files.  This is useful when include is being used without providing an initial file or app to load.
     * You can include files, but then call include.start() to start actually loading them.
     * 
     * <h3>Example:</h3>
     * @codestart html
     * &lt;script src='steal/include.js'>&lt;/script>
     * &lt;script type='text/javascript'>
     *    include.plugins('controller')
     *    include.start();
     * &lt;/script>
     * @codeend
     * The above code loads include, then uses include to load the plugin controller.
     */
    start: function(){
        include.start_called = true;
            if (include.options.env != 'production')
                include.end();
    },
    start_called : false,
    functions: [],
    next_function : function(){
        var func = include.functions.pop();
        if(func) func.func();
    },
    /**
     * Includes CSS from the stylesheets directory.
     * @param {String} css the css file's name to load, include will add .css.
     */
    css: function(){
        var arg;
        for(var i=0; i < arguments.length; i++){
            arg = arguments[i];
            include.css_rel('../../stylesheets/'+arg);
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
            var current = new File(arg+".css").join_current();
            include.create_link( include.root.join(current)  );
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
       var contentType = content_type || "application/x-www-form-urlencoded; charset="+include.options.encoding
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
            var current_path = include.getPath();
            include.setPath("");
            if(name.path){
                name.path = f(name.path)
            }else{
                name = f(name)
            }
            include(name);
            include.setPath(current_path);
            return include;
        }
    },
    callOnArgs : function(f){
        return function(){
            for(var i=0; i < arguments.length; i++) f(arguments[i]);
            return include;
        }
        
    },
    // Returns a function that applies a function to a list of arguments.  Then includes those
    // arguments.
    applier: function(f){
        return function(){
            for (var i = 0; i < arguments.length; i++) {
                arguments[i] = f(arguments[i]);
            }
            include.apply(null, arguments);
            return include;
        }
    },
    log : function(){
        $('#log').append(jQuery.makeArray(arguments).join(", ")+"<br/>")
    },
    then : include,
    total: total
});
include.app = include.resetApp(function(p){return p+'/'+getLastPart(p)})
include.plugin = include.resetApp(function(p){return p+'/'+getLastPart(p)})
/**
 * @function plugins
 * Loads a list of plugins in /steal/plugins
 * @param {String} plugin_location location of a plugin, ex: dom/history.
 */
include.apps = include.callOnArgs(include.app);
include.plugins = include.callOnArgs(include.plugin);
include.engine = include.resetApp(function(p){
    var parts = p.split("/");
    if(!parts[1])parts[1] = parts[0];
    return 'engines/'+ parts[0]+'/apps/'+parts[1]+"/init.js"
});
/**
 * @function engines
 * Includes engines by name.  Engines are entire MVC stacks in the engines directory.
 * @param {String} engine_name If there are no '/'s, include will load 
 *     'engines/<i>engine_name</i>/apps/<i>engine_name</i>/init.js'; if engine_name looks like: 'engine/part' it will load
 *     'engines/<i>engine</i>/apps/<i>part</i>/init.js'.
 */
include.engines = include.callOnArgs(include.engine);
/**
 * @function controllers
 * Includes controllers from the controllers directory.  Will add _controller.js to each name passed in.
 * @param {String} controller_name A controller to include.  "_controller.js" is added to the name provided.
 */
include.controllers = include.applier(function(i){return '../../controllers/'+i+'_controller'});
/**
 * @function models
 * Includes files in the /models directory.
 * @param {String} model_name the name of the model file you want to load.
 */
include.models = include.applier(function(i){return '../../models/'+i});
/**
 * @function resources
 * Includes a list of files in the <b>/resources</b> directory.
 * @param {String} resource_path resource you want to load.
 */
include.resources = include.applier(function(i){return '../../resources/'+i});
/**
 * @function views
 * Includes a list of files in the <b>/views</b> directory.
 * @param {String} view_path view you want to load.
 */
include.views = function(path){
    var type = path.match(/\.\w+$/gi)[0].replace(".","");
	include({src: path, type: type});    
	return include;
};

var script_tag = function(){
    var start = document.createElement('script');
    start.type = 'text/javascript';
    return start;
};

var insert = function(src, type, onlyInsert){
    // source we need to know how to get to steal, then load 
    // relative to path to steal
    console.log(src)
	if(src){
        var src_file = new File(src);
        if(!src_file.isLocalAbsolute() && !src_file.isDomainAbsolute())
            src = include.root.join(src);
    }

    var scriptTag = '<script type="'+((typeof type!='undefined')?(type+'" '):'text/javascript" ');
    scriptTag += src?('src="'+src+'" '):'';
    scriptTag += src?('id="'+src.replace(/[\/\.]/g,"_")+'" '):'';
    scriptTag += 'compress="'+((typeof include.current['compress']!='undefined')?
        (include.current['compress']+'" '):'true" ');
    scriptTag += 'package="'+((typeof include.current['package']!='undefined')?
        (include.current['package']+'">'):'production.js">');    
    scriptTag += '</script>'; 
    
    document.write(
        (src? scriptTag : '') + (onlyInsert ? "" : call_end())
    );

};

var call_end = function(src){
    return !browser.msie ? '<script type="text/javascript">include.end();</script>' : 
    '<script type="text/javascript" src="'+include.root.join('steal/end.js')+'"></script>'
}

var head = function(){
    var d = document, de = d.documentElement;
    var heads = d.getElementsByTagName("head");
    if(heads.length > 0 ) return heads[0];
    var head = d.createElement('head');
    de.insertBefore(head, de.firstChild);
    return head;
};



include.init();
})();

