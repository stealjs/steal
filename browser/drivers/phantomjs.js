steal('steal/browser', 'steal/browser/utils/rhinoServer.js', function(){
	var page;
	steal.browser.phantomjs = function(options){
		steal.browser.apply(this, arguments)
		steal.browser.data = "";
		this.type = 'phantomjs';
		this.options = options;
		this._startServer();
		this._evts = {}
	}
	steal.browser.phantomjs.prototype = new steal.browser();
	steal.extend(steal.browser.phantomjs.prototype, {
		_startServer: function(){
			var self = this;
			spawn(function(){
				self.simpleServer()
			})
		},
		open: function(page){
			var page = this._appendParamsToUrl(page);
			spawn(function(){
				runCommand("sh", "-c", "phantomjs steal/browser/utils/phantomLauncher.js "+page)
			})
			return this;
		},
		_processData: function(data){
			var d = decodeURIComponent(unescape(data));
//			print(d)
			eval("var res = "+d)
			// parse data into res
			for (var i = 0; i < res.length; i++) {
				evt = res[i];
				// server receives duplicate requests for an unknown reason
				// to work around this we check event ids to make sure we're not seeing a duplicate
				if(this._evts[evt.id]) continue;
				this._evts[evt.id] = true
				this.trigger(evt.type, evt.data);
				if (evt.type == "done") {
					quit();
				}
			}
		}
	})
})