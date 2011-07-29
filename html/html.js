steal(function(s){

var window = (function() {
		return this;
	}).call(null, 0),
	url;

/**
 * @function steal.html
 * @parent stealjs
 * Loads a page in Envjs and gets it's HTML when it's ready.
 * 
 * http://code.google.com/web/ajaxcrawling/docs/getting-started.html
 * 
 *     <meta name="fragment" content="!">
 * 
 *     // writes the html to the command line: 
 *     load('steal/rhino/rhino.js')
 *     steal('steal/html', function(){
 *     	steal.html("page.html#Hello+World!")
 *     })
 * 
 * 
 * @param {String} urlo the url of the page to open. The url should be 
 *   relative to [steal.static.root steal.root] or a website.
 * @param {Object|Function} opts
 */
var html = steal.html = function(urlo, opts){
	
	var url = url,
		options = opts;
	
	steal.html.load(urlo, function(helpers){
		var html = helpers.html();
		if(typeof opts === "function"){
			opts(html)
		} else {
			print(html)
		}
	})

	
	
},
	options,
	count;
// wait for steal.done
	
var count = 0,
	readyFunc;
/**
 * @function steal.html.wait
 * @parent steal.html
 * Waits for the html to finish
 */
html.wait = function(){
	count++;
};
/**
 * @function steal.html.ready
 * @parent steal.html
 * Lets the page know it's ready to render the html
 */
html.ready = function(){
	count--;
	//print("    readyC "+count)
	if(readyFunc && count <= 0){
		readyFunc();
	}
	
};
html.onready = function(func){
	readyFunc = func;
	
	if(count <= 0){
		readyFunc();
	}
};

html.load = function(url, callback){
	
	load('steal/rhino/env.js');
	
	Envjs(url, {
		scriptTypes: {
			"text/javascript": true,
			"text/envjs": true,
			"": true
		},
		logLevel: 2,
		dontPrintUserAgent: true,
	});
		
	var newSteal = window.steal,
		getDocType  = function(){
			var content;
			if(s.File(url).domain() === null){
				content = readFile(s.File(url).clean());
			} else {
				content = readUrl(url);
			}
			var docTypes = content.match( /<!doctype[^>]+>/i );
			return docTypes ? docTypes[0] : "";
		};
	
	newSteal.one('done', function(){
		callback({
			newSteal : newSteal,
			html : function(){
				return getDocType()+"\n"+document.innerHTML
			}
		})
	} );
};

});