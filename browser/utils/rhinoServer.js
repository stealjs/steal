// listens for 3001, returns something super simple
(function(){
	var response = function(content, output){
		output.writeBytes("HTTP/1.1 200 OK" + "\r\n");
		output.writeBytes("Server: Java HTTPServer" + "\r\n");
		output.writeBytes("Content-Type: text/html" + "\r\n");
		output.writeBytes("Content-Length: " + content.length + "\r\n");
		output.writeBytes("Connection: close\r\n");
		output.writeBytes("\r\n");
		output.writeBytes(content);
	}
	var evalText = null, 
		scriptText = null,
		id = 0;
	var processRequest = function(sock, browser){
		id++;
		spawn(function(){
			var myid = id;
			if (stopServer) {
				return;
			}
			var bufr = new java.io.BufferedReader(new java.io.InputStreamReader(sock.getInputStream()));
			
			var v = new java.util.Vector(10); // collects headers sent by browser
			var done = false;
			
			while (!done) {
				try {
					var x = bufr.readLine();
					if (x.length() == 0) {
						done = true;
					}
					else {
						var params = x.match(/^GET.*\?(.*)\s/)
						if (params.length) {
//							print("params: "+params[1]);
							// don't block thread from finishing
							(function(p){
							spawn(function(){
								browser._processData(p)
							})
							})(params[1]);
						}
						v.addElement(x);
					}
				} 
				catch (e) {
					done = true;
				}
			}
			// write output
			var output = new java.io.DataOutputStream(sock.getOutputStream()),
				resp = "";
			if(evalText || scriptText){
				resp = evalText? "steal.client.evaluate('"+evalText+"');": scriptText;
				evalText = null;
				scriptText = null;
				response(resp, output);
				output.close();
				browser.injectJSInProgress = false;
			}
			
			bufr.close();
		})
	}, 
	stopServer;
	steal.browser.prototype.stopServer = function(){
		serv.close();
		stopServer = true;
	}
	steal.browser.prototype.evaluate = function(fn){
		// wait until previous finishes
		while(this.evaluateInProgress || this.injectJSInProgress) {
			java.lang.Thread.currentThread().sleep(300);
		}
		evalText = fn.toString().replace(/\n|\r\n/g,"");
		this.evaluateInProgress = true;
		while(this.evaluateInProgress || this.injectJSInProgress) {
			java.lang.Thread.currentThread().sleep(300);
		}
		var res = this.evaluateResult;
		this.evaluateResult = null;
		return res;
	}
	steal.browser.prototype.injectJS = function(file){
		// wait until previous finishes
		while(this.evaluateInProgress || this.injectJSInProgress) {
			java.lang.Thread.currentThread().sleep(300);
		}
		this.injectJSInProgress = true;
		scriptText = readFile(file).replace(/\n|\r\n/g,"");
		while(this.evaluateInProgress || this.injectJSInProgress) {
			java.lang.Thread.currentThread().sleep(300);
		}
	}
	var serv;
	steal.browser.prototype.simpleServer = function(){
		stopServer = false;
		serv = new java.net.ServerSocket(5555);
		while (!stopServer) {
			var killed = false;
			try {
				var sock = serv.accept();
			}catch(e){}
			if (!stopServer) {
				var copy = sock;
				sock = null;
				processRequest(copy, this);
			}
		}
		serv.close();
	}
})()