steal('steal/browser', function(){
	steal.browser.selenium = function(options){
		steal.browser.apply(this, arguments)
		this.type = 'selenium';
		this.serverPort = options.serverPort || 4444;
		this.serverHost = options.serverHost || "localhost";
		this.serverDomain = options.serverDomain;
		this._startSelenium();
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
			this.page = this._appendParamsToUrl(page);
			this.browsers = browsers;
			this._browserStart(0);
			return this;
		},
		_startSelenium: function(){
			importClass(Packages.com.thoughtworks.selenium.DefaultSelenium);
			
			//first lets ping and make sure the server is up
			var addr = java.net.InetAddress.getByName(this.serverHost)
			try {
				var s = new java.net.Socket(addr, this.serverPort)
			} 
			catch (ex) {
				spawn(function(){
					var jarCommand = 'java -jar '+
						'funcunit/sel/selenium-server-standalone-2.0rc3.jar'+
						' -userExtensions '+
						'funcunit/sel/user-extensions.js';
					if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
						var command = 'start "selenium" ' + jarCommand;
						runCommand("cmd", "/C", command.replace(/\//g, "\\"))
					}
					else {
						var command = jarCommand;// + " > selenium.log 2> selenium.log &";
						runCommand("sh", "-c", command);
					}
				})
				var timeouts = 0, 
					started = false;
				var pollSeleniumServer = function(){
					try {
						var s = new java.net.Socket(addr, this.serverPort)
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
		close: function(){
			if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1) {
				runCommand("cmd", "/C", 'taskkill /fi "Windowtitle eq selenium" > NUL')
				//quit()
			}
		},
		// create new selenium instance, start it, open page, set FuncUnit.mode = "Selenium", start polling for data
		_browserStart: function(index){
			var browser = this.browsers[this._currentBrowserIndex];
			this.trigger("browserStart", {
				browser: browser
			})
			this.selenium = new DefaultSelenium(this.serverHost, 
				this.serverPort, 
				browser, 
				this.serverDomain);
			this.selenium.start();
			this.selenium.open(this.page);
			this._poll();
		},
		_browserDone: function(data){
			var browser = this.browsers[this._currentBrowserIndex];
			this.trigger("browserDone", {
				browser: browser
			})
			this.selenium.close();
			this.selenium.stop();
			this._currentBrowserIndex++;
			if (this._currentBrowserIndex < this.browsers.length) {
				this._browserStart(this._currentBrowserIndex)
			} 
			else {
				this.close();
				this.trigger("done");
			}
		},
		_poll: function(){
			var resultJSON, 
				res,
				evt,
				keepPolling = true;
			resultJSON = this.selenium.getEval("Selenium.getResult()");
			eval("res = "+resultJSON);
			if(res && res.length){
				for (var i = 0; i < res.length; i++) {
					evt = res[i];
					if (evt.type == "done") {
						keepPolling = false;
						this._browserDone(evt.data);
					}
					else {
						this.trigger(evt.type, evt.data);
					}
				}
			}
			if(keepPolling) {
				// keep polling
				java.lang.Thread.currentThread().sleep(400);
				this._poll();
			}
		}
	})
})