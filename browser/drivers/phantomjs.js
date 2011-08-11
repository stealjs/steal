steal('steal/browser', function(){
	var page;
	steal.browser.phantomjs = function(options){
		steal.browser.apply(this, arguments)
		this.type = 'phantomjs';
		this.options = options;
	}
	steal.browser.phantomjs.prototype = new steal.browser();
	steal.extend(steal.browser.phantomjs.prototype, {
		open: function(page){
			this.page = this._appendParamsToUrl(page);
			var page = new WebPage(), 
				trigger = this.trigger,
				self = this;
//			console.log(trigger, 'trigger')
			page.onConsoleMessage = function (msg) {
			    console.log(msg);
			};
			page.open(this.page, function (status) {
				var cb = arguments.callee;
			    var res = page.evaluate(function () {
			        if (typeof steal !== "undefined" && steal.client && steal.client.dataQueue) {
//						console.log(steal.client.dataQueue.length)
						var res = steal.client.dataQueue;
						steal.client.dataQueue = [];
						return res;
					}
			    });
				if(res && res.length){
					for (var i = 0; i < res.length; i++) {
						evt = res[i];
//						console.log(evt.type)
						if (evt.type == "done") {
							keepPolling = false;
//							this.webpage.exit();
						}
						else {
//							console.log(self.trigger, 'trigger2')
							self.trigger(evt.type, evt.data);
						}
					}
				}
				setTimeout(arguments.callee, 500)
			});
			
			return this;
		},
		_poll: function(){
			var res,
				evt,
				keepPolling = true;
			console.log("HERE00")
			for(var i in page){
				print(i, page[i])
			}
			res = page.evaluate(function(){
				console.log("HERE1")
				if (typeof steal !== "undefined" && steal.client && steal.client.dataQueue) {
					return steal.client.dataQueue;
				}
				else {
					return [];
				}
			})
			console.log("HERE11")
			if(res && res.length){
				for (var i = 0; i < res.length; i++) {
					evt = res[i];
					if (evt.type == "done") {
						keepPolling = false;
						this.webpage.exit();
					}
					else {
						this.trigger(evt.type, evt.data);
					}
				}
			}
			console.log("HERE22")
			if(keepPolling) {
				// keep polling
				window.setTimeout(arguments.callee, 400);
			}
			console.log("HERE2", res)
		}
	})
})