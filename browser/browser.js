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
//			console.log("trigger: "+eventName)
			this._events[eventName](data);
		},
		// shut down server or just kill the browser instance
		close: function(){},
		// adds commandline=true&browser=selenium
		// if there are already params, appends them, otherwise, adds params
		_appendParamsToUrl: function(url){
			var params = "mode=commandline&browser=" + this.type;
			if (/\?/.test(url)) {
				url += "&" + params;
			}
			else {
				url += "?" + params;
			}
			return url;
		}
	})
})()