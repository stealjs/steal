// listens for 3001, returns something super simple
(function(){
	var id = 0, 
	response = function(content, output){
		id++;
		var out = "cb({'id': "+id+", 'fn': function(){"+content+"}});";
		output.writeBytes("HTTP/1.1 200 OK" + "\r\n");
		output.writeBytes("Server: Java HTTPServer" + "\r\n");
		output.writeBytes("Content-Type: text/html" + "\r\n");
		output.writeBytes("Content-Length: " + out.length + "\r\n");
		output.writeBytes("Connection: close\r\n");
		output.writeBytes("\r\n");
//		print('RESPONSE: '+out)
		output.writeBytes(out);
	}
	var evalText = null, 
		scriptText = null,
	processRequest = function(sock, browser, id){
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
						var params = x.match(/^GET.*\?(.*)&_=/);
						if (params.length) {
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
//				print('evalText: '+evalText)
				resp = evalText? "steal.client.evaluate('"+evalText+"');": scriptText;
				evalText = null;
				scriptText = null;
				response(resp, output);
				browser.injectJSInProgress = false;
			} else {
				response("", output);
			}
			
			output.close();
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
//			print('evaluate 1b: '+evalText)
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
				processRequest(copy, this, id);
			}
		}
		serv.close();
	}
})()