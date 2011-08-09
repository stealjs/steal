steal('steal/browser', function(){
	steal.browser.envjs = function(options){
		steal.browser.apply(this, arguments)
		this.type = 'envjs';
		this.options = options;
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