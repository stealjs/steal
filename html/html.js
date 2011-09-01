steal('steal/browser/phantomjs', function(){
print('inside html.j')
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
	print("html: " + urlo)
	steal.html.load(urlo, function(html){
		if(typeof opts === "function"){
			opts(html)
		} else {
			print(html)
		}
	})

	
	
};
// wait for steal.done
steal.html.onready = function(func){
	readyFunc = func;
	
	if(count <= 0){
		readyFunc();
	}
};

steal.html.load = function(url, callback){
	var getDocType  = function(url){
		var content;
		print('URL: '+url)
		if(steal.File(url).domain() === null){
			content = readFile(steal.File(url).clean());
		} else {
			content = readUrl(url);
		}
		var docTypes = content.match( /<!doctype[^>]+>/i );
		return docTypes ? docTypes[0] : "";
	};
	
	print('open: '+url)
	var browser = new steal.browser.phantomjs({
		print: true
	})
	browser.bind('pageready', function(){
		print('PAGEREADY')
		var docType = getDocType(url),
			html = this.evaluate(function(){
				return document.documentElement.innerHTML;
			}),
			total = docType+"\n"+html;
			print(" HTML: "+html)
		callback.call(this, total)
	})
	.open(url)
};

});