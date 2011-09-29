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
	var getDocType  = function(url){
		var content;
		if(steal.File(url).domain() === null){
			content = readFile(steal.File(url).clean());
		} else {
			content = readUrl(url);
		}
		var docTypes = content.match( /<!doctype[^>]+>/i );
		return docTypes ? docTypes[0] : "";
	};
	
	var browser = new steal.browser.phantomjs({
		print: true
	})
	browser.bind('pageready', function(){
		var docType = getDocType(url),
			html = this.evaluate(function(){
				return document.documentElement.innerHTML;
			}),
			total = docType+"\n"+html;
		// print(" HTML: "+total)
		callback.call(this, total)
	})
	.open(url)
};

});