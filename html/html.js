steal(function(){

	var s = steal;
	
	/**
	 * @function steal.html
	 * @parent stealjs
	 *
	 * @signature `html(urlo, opts)`
	 * 
	 * @param {String} urlo The url of the page to open. The url should be 
	 * relative to [steal.config.root rootfolder] or a website.
	 * @param {Object|Function} opts
	 *
	 * @body
	 * 
	 * `steal.html(url)` loads a page in Envjs and gets it's HTML 
	 * when it's ready. Use this to make your site
	 * crawlable [AJAX crawling for Google](http://code.google.com/web/ajaxcrawling/docs/getting-started.html).
	 * 
	 *  
	 * 
	 *     // writes the html to the command line: 
	 *     load('steal/rhino/rhino.js')
	 *     steal('steal/html', function(){
	 *        steal.html("page.html#Hello+World!")
	 *     })
	 * 
	 * 
	 */
	steal.html = function(urlo, opts){
		
		var options = opts,
			browser = opts.browser || "envjs";
		
			s.html.load(urlo, browser, function(html){
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
	
	// Methods intended to be used in the application
	
	var count = 0,
		readyFunc;
	/**
	 * @function steal.html.wait
	 * @parent steal.html
	 *
	 * @signature `wait()`
	 *
	 * @body
	 * 
	 * Waits for the html to finish
	 */
	steal.html.wait = function(){
		count++;
	};
	/**
	 * @function steal.html.ready
	 * @parent steal.html
	 *
	 * @signature `ready()`
	 *
	 * @body
	 * 
	 * Lets the page know it's ready to render the html
	 */
	steal.html.ready = function(){
		count--;
		if(count <= 0 && steal.client){
			steal.client.trigger("pageready", window.location.hash)
		}
	};
	
})