steal('steal/browser', function(){
	steal.browser.envjs = function(options){
		options = options || {};
		for(var option in steal.browser.envjs.defaults){
			if(typeof options[option] === "undefined"){
				options[option] = steal.browser.envjs.defaults[option]
			}
		}
		steal.browser.apply(this, arguments)
		this.type = 'envjs';
		this.options = options;
		var self = this;
		Envjs.trigger = function(){
			self.trigger.apply(self, arguments);
		};
	}
	steal.browser.envjs.defaults = {
		scriptTypes: {
			"text/javascript": true,
			"text/envjs": true,
			"": true
		},
		logLevel: 2,
		dontPrintUserAgent: true
	}
	steal.browser.envjs.prototype = new steal.browser();
	steal.extend(steal.browser.envjs.prototype, {
		open: function(page){
			this.page = this._appendParamsToUrl(page);
			Envjs(this.page, this.options);
			return this;
		},
		close: function(){
			
		}
	})
}).then('steal/rhino/env.js')