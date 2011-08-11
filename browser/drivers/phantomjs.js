steal('steal/browser', 'steal/browser/server.js', function(){
	var page;
	steal.browser.phantomjs = function(options){
		steal.browser.apply(this, arguments)
		DATA = "";
		this.type = 'phantomjs';
		this.options = options;
		this._startServer();
	}
	steal.browser.phantomjs.prototype = new steal.browser();
	steal.extend(steal.browser.phantomjs.prototype, {
		_startServer: function(){
			spawn(this.simpleServer)
			this._poll();
		},
		open: function(page){
			this.page = this._appendParamsToUrl(page);
			var page = new WebPage(), 
				trigger = this.trigger,
				self = this;
			page.onConsoleMessage = function (msg) {
			    console.log(msg);
			};
			page.open(this.page, function (status) {
				var cb = arguments.callee;
			    var res = page.evaluate(function () {
			        if (typeof steal !== "undefined" && steal.client && steal.client.dataQueue) {
						var res = steal.client.dataQueue;
						steal.client.dataQueue = [];
						return res;
					}
			    });
				if(res && res.length){
					for (var i = 0; i < res.length; i++) {
						evt = res[i];
						if (evt.type == "done") {
							keepPolling = false;
//							this.webpage.exit();
						}
						else {
							self.trigger(evt.type, evt.data);
						}
					}
				}
				setTimeout(arguments.callee, 500)
			});
			
			return this;
		},
		_poll: function(){
			if(DATA.length){
				print(DATA)
				// parse data into res
//				for (var i = 0; i < res.length; i++) {
//					evt = res[i];
//					if (evt.type == "done") {
//						keepPolling = false;
//					}
//					else {
//						this.trigger(evt.type, evt.data);
//					}
//				}
			}
			DATA = "";
			// keep polling
			java.lang.Thread.currentThread().sleep(400);
			arguments.callee.apply(this);
		}
	})
})