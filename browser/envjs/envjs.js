steal('steal/browser', function(){
	steal.browser.envjs = function(options){
		options = options || {};
		for(var option in steal.browser.envjs.defaults){	
			if(typeof options[option] === "undefined"){
				options[option] = steal.browser.envjs.defaults[option]
			}
		}
		this.type = 'envjs';
		steal.browser.apply(this, arguments)
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
			page = this._getPageUrl(page);
			page = this._appendParamsToUrl(page);
			this.curSteal = steal;
			Envjs(page, this.options);
			return this;
		},
		close: function(){
			// restore steal
			steal = this.curSteal;
		},
		evaluate: function(fn){
			return fn();
		},
		injectJS: function(file){
			load(file);
		}
	})
}).then('steal/rhino/env.js')