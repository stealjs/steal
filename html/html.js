steal(function(){

	var s = steal;
	
/**
 * @function steal.html
 * @parent stealjs
 * Loads a page in Envjs and gets it's HTML when it's ready.
 * 
 * Designed to solve [http://code.google.com/web/ajaxcrawling/docs/getting-started.html AJAX crawling for Google].
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
	
	var options = opts,
		browser = opts.browser || "envjs";
	
		steal.html.load(urlo, browser, function(html){
			if(typeof opts === "function"){
				opts(html)
			} else {
				print(html)
			}
		})

};

steal.html.load = function(url, browserType, callback){
	steal('steal/browser/'+browserType, function(){
		var browser = new s.browser[browserType]({
			print: true
		})
		browser.bind('pageready', function(hash){
			callback.call(this, hash)
		})
		.open(url)
	});
};

})