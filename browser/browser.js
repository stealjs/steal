(function(){
	/**
	 * steal.browser is an abstraction layer for browser drivers.  There is currently support for 
	 * envjs, phantomjs, and selenium.  Each driver implements an API that includes open, bind, trigger, 
	 * evaluate, and injectJS.  There is also a small client component that is loaded by steal.js.
	 * 
	 * The initial bootstrap of steal.browser works like this:
	 * 1. steal.browser is used to open a page.  The page's URL is appended with 
	 * ?mode=commandline&browser=phantomjs (or whatever driver is being used).
	 * 2. On the client, steal.js does a check for these URL params.  If they're 
	 * found, steal loads steal/browser/phantomjs/client.js.  Client.js is a small file that implements
	 * methods used for evaluating code and triggering events.
	 * 3. Client.js loads jquery.js, runs $.holdReady(true) (to prevent the app from initializing), and 
	 * runs steal.client.trigger('clientloaded') (to notify the server that the browser's client.js has 
	 * loaded.
	 * 4. Now, the server can perform any startup logic it needs, like using injectJS to load files or 
	 * evaluating code.  Whenever its done, it runs this.evaluate(function(){ $.holdReady(false); }).
	 * 5. Document ready is fired on the client, and the application starts up.  Its important to note 
	 * that any app using steal.browser can't trigger browser events until after document.ready.  This is 
	 * required because the server needs to have a chance to load its own code and prevent race conditions.
	 * @param {Object} options
	 */
	steal.browser = function(options){
		this._events = {};
		// driver should start the server if there is one (selenium/jstestdriver)
	};
	
	// generic steal.browser API
	// each driver defines their own methods for these
	steal.extend(steal.browser.prototype, {
		// open the page and start listening for data sent by steal.client
		open: function(page){},
		bind: function(eventName, fn){
			this._events[eventName] = fn;
			return this;
		},
		trigger: function(eventName, data){
			var handler = this._events[eventName];
			handler && handler.call(this, data);
		},
		// shut down server or just kill the browser instance
		close: function(){},
		// adds commandline=true&browser=selenium
		// if there are already params, appends them, otherwise, adds params
		_appendParamsToUrl: function(url){
			// should be & separated, but but in phantomjs prevents that url from being read, so we use a comma
			var params = "mode=commandline,browser=" + this.type;
			if (/\?/.test(url)) {
				url += "&" + params;
			}
			else {
				url += "?" + params;
			}
			return url;
		},
		_getPageUrl: function(page){
			if(typeof phantom === "undefined" && !/http:|file:/.test(page)){ // if theres no protocol, turn it into a filesystem url
				var cwd = (new java.io.File (".")).getCanonicalPath();
				page = "file:///"+cwd+"/"+page;
				page = page.replace(/\\/g, "/")
			}
			
			//convert spaces to %20.
			var newPage = /http:/.test(page) ? page: page.replace(/ /g,"%20");
			return newPage;
		},
	})
})()