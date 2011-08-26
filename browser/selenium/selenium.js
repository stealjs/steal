steal('steal/browser', function(){
	steal.browser.selenium = function(options){
		steal.browser.apply(this, arguments)
		this.type = 'selenium';
		this.serverPort = options.serverPort || 4444;
		this.serverHost = options.serverHost || "localhost";
		this._startSelenium();
		this.DefaultSelenium = this._loadDriverClass();
	}
	steal.browser.selenium.prototype = new steal.browser();
	steal.extend(steal.browser.selenium.prototype, {
		/**
		 * Opens the browser, at each of the specified browsers, one by one
		 * @param {Object} page
		 * @param {Object} browsers
		 */
		open: function(page, browsers){
			this._currentBrowserIndex = 0;
			this.page = this._getPageUrl(page);
			this.page = this._appendParamsToUrl(this.page);
			this.browsers = browsers || ["*iexplore"];
			this._browserStart(0);
			return this;
		},
		_loadDriverClass: function() {
			var URLClassLoader = Packages.java.net.URLClassLoader,
				URL = java.net.URL,
				File = java.io.File,
				ss = new File("steal/browser/selenium/selenium-java-client-driver.jar"),
				ssurl = ss.toURL(),
				urls = java.lang.reflect.Array.newInstance(URL, 1);
			urls[0] = new URL(ssurl);

			var clazzLoader = new URLClassLoader(urls),
				mthds = clazzLoader.loadClass("com.thoughtworks.selenium.DefaultSelenium").getDeclaredConstructors(),
				rawMeth = null;
			//iterate through methods to find the one we are looking for
			for ( var i = 0; i < mthds.length; i++ ) {
				var meth = mthds[i]; 
				if ( meth.toString().match(/DefaultSelenium\(java.lang.String,int,java.lang.String,java.lang.String\)/) ) {
					constructor = meth;
				}
			} 
			return function( serverHost, serverPort, browserStartCommand, browserURL ) {
				var host = new java.lang.String(serverHost),
					port = new java.lang.Integer(serverPort),
					cmd = new java.lang.String(browserStartCommand),
					url = new java.lang.String(browserURL);
				return constructor.newInstance(host, port, cmd, url);
			};
		},
		_startSelenium: function(){
			//first lets ping and make sure the server is up
			var port = this.serverPort, 
				addr = java.net.InetAddress.getByName(this.serverHost)
			try {
				var s = new java.net.Socket(addr, port)
			} 
			catch (ex) {
				spawn(function(){
					var jarCommand = 'java -jar '+
						'steal/browser/selenium/selenium-server-standalone-2.0rc3.jar'+
						' -userExtensions '+
						'funcunit/commandline/user-extensions.js';
					if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
						var command = 'start "selenium" ' + jarCommand;
						runCommand("cmd", "/C", command.replace(/\//g, "\\"))
					}
					else {
						var command = jarCommand + " > selenium.log 2> selenium.log &";
						runCommand("sh", "-c", command);
					}
				})
				var timeouts = 0, 
					started = false;
				var pollSeleniumServer = function(){
					try {
						var s = new java.net.Socket(addr, port)
						started = true;
					} 
					catch (ex) {
						if (timeouts > 20) {
							print("Selenium is not running. Please use js -selenium to start it.")
							quit();
						} else {
							timeouts++;
						}
					}					
				}
				while(!started){
					java.lang.Thread.currentThread().sleep(1000);
					pollSeleniumServer();
				}
			}
		},
		killServer: function(){
			if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
//				runCommand("cmd", "/C", 'taskkill /fi "Windowtitle eq selenium" > NUL')
				//quit()
			}
		},
		// create new selenium instance, start it, open page, set FuncUnit.mode = "Selenium", start polling for data
		_browserStart: function(index){
			var browser = this.browsers[this._currentBrowserIndex];
			this.trigger("browserStart", {
				browser: browser
			})
			this.selenium = this.DefaultSelenium(this.serverHost, 
				this.serverPort, 
				browser, 
				this.page);
			this.selenium.start();
			this.selenium.open(this.page);
			this._poll();
		},
		close: function(data){
			this.keepPolling = false;
			var browser = this.browsers[this._currentBrowserIndex];
			this.trigger("browserDone", {
				browser: browser
			})
			print(this.selenium)
			this.selenium.close();
			this.selenium.stop();
			this._currentBrowserIndex++;
			if (this._currentBrowserIndex < this.browsers.length) {
				this._browserStart(this._currentBrowserIndex)
			} 
			else {
				this.killServer();
				this.trigger("done");
			}
		},
		_poll: function(){
			var self = this;
			spawn(function(){
				if(!this.keepPolling) return;
				var resultJSON, 
					res,
					evt;
				self.keepPolling = true;
				resultJSON = self.selenium.getEval("Selenium.getResult()");
				eval("res = "+resultJSON);
				if(res && res.length){
					for (var i = 0; i < res.length; i++) {
						evt = res[i];
						if (evt.type == "done") {
							self.keepPolling = false;
							self.close(evt.data);
						}
						else {
							self.trigger(evt.type, evt.data);
						}
					}
				}
				// keep polling
				java.lang.Thread.currentThread().sleep(400);
				arguments.callee();
			})
		}
	})
})