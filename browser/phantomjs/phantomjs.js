steal('steal/browser', 'steal/browser/utils/rhinoServer.js', function(){
	var page;
	steal.browser.phantomjs = function(options){
		this.type = 'phantomjs';
		steal.browser.apply(this, arguments)
		steal.browser.data = "";
		this.options = options || {};
		this._startServer();
		this._evts = {}
		var self = this;
		this.bind("evaluated", function(data){
			self.evaluateResult = data;
			self.evaluateInProgress = false;
		})
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
			page = this._getPageUrl(page);
			page = this._appendParamsToUrl(page);
			var verbose = this.options.print;
			this.launcher = spawn(function(){
				var cmd = "phantomjs steal/browser/phantomjs/launcher.js "+page+(verbose?  " -verbose": "");
				if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
					runCommand("cmd", "/C", cmd)
				}
				else {
					var command = cmd + " > selenium.log 2> selenium.log &";
					runCommand("sh", "-c", cmd);
//					runCommand("sh", "-c", cmd+" 2> 1&");
				}
			})
			// block until we're done
			this.browserOpen = true;
			while(this.browserOpen) {
				java.lang.Thread.currentThread().sleep(1000);
			}
			return this;
		},
		// kill phantom and kill simple server
		close: function(){
//			this.launcher.stop();
//			this.launcher.destroy();
			this.kill();
			this.stopServer();
			this.browserOpen = false;
		},
		kill: function(){
			spawn(function(){
				if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
					runCommand("cmd", "/C", 'taskkill /f /fi "Imagename eq phantomjs.exe" > NUL')
				} else { // mac
					runCommand("sh", "-c", "ps aux | awk '/phantomjs\\/launcher/ {print$2}' | xargs kill -9")
				}
			})
		},
		_processData: function(data){
			var d = decodeURIComponent(unescape(data));
//			print("_processData: "+d)
			eval("var res = "+d)
			// parse data into res
			for (var i = 0; i < res.length; i++) {
				evt = res[i];
				// server receives duplicate requests for an unknown reason
				// to work around this we check event ids to make sure we're not seeing a duplicate
				if(this._evts[evt.id]) continue;
				this._evts[evt.id] = true
				var self = this;
				(function(e){
				spawn(function(){
					self.trigger(e.type, e.data);
				})
				})(evt)
			}
		}
	})
})