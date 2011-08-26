steal('steal/browser', 'steal/browser/utils/rhinoServer.js', function(){
	var page;
	steal.browser.phantomjs = function(options){
		steal.browser.apply(this, arguments)
		steal.browser.data = "";
		this.type = 'phantomjs';
		this.options = options || {};
		this.kill();
		this._startServer();
		this._evts = {}
		var self = this;
		this.bind("evaluated", function(data){
			self.evaluated = data;
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
		getPageUrl: function(page){
			if(typeof phantom === "undefined" && !/http:|file:/.test(page)){ // if theres no protocol, turn it into a filesystem url
				var cwd = (new java.io.File (".")).getCanonicalPath();
				page = "file:///"+cwd+"/"+page;
				page = page.replace(/\\/g, "/")
			}
			
			//convert spaces to %20.
			var newPage = /http:/.test(page) ? page: page.replace(/ /g,"%20");
			return newPage;
		},
		open: function(page){
			page = this.getPageUrl(page);
			page = this._appendParamsToUrl(page);
			var verbose = this.options.print;
			spawn(function(){
				var cmd = "phantomjs steal/browser/phantomjs/launcher.js "+page+(verbose?  " -verbose": "");
				if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
					runCommand("cmd", "/C", cmd)
				}
				else {
					runCommand("sh", "-c", cmd);
				}
			})
			return this;
		},
		// kill phantom and kill simple server
		close: function(){
			this.kill();
			this.stopServer();
		},
		kill: function(){
			if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
				runCommand("cmd", "/C", 'taskkill /f /fi "Imagename eq phantomjs.exe" > NUL')
			}
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