steal('steal/browser/phantomjs', function(){

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
steal.html = function(urlo, opts){
	
	var options = opts;
	steal.html.load(urlo, function(html){
		if(typeof opts === "function"){
			opts(html)
		} else {
			print(html)
		}
	})

	
	
};

steal.html.load = function(url, callback){
	var browser = new steal.browser.phantomjs({
		print: true
	})
	browser.bind('pageready', function(hash){
		callback.call(this, hash)
	})
	.open(url)
};

});