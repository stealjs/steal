(function(){
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