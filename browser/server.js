// listens for 3001, returns something super simple

function process(sock){
	var copy = sock;
	sock = null;
	spawn(function(){
		var bufr = new java.io.BufferedReader(new java.io.InputStreamReader(copy.getInputStream()));
		
		var prtw = new java.io.PrintWriter(copy.getOutputStream(), false); // no autoFlush
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
						DATA = params[1];
//						print(params[1])
					}
					v.addElement(x);
				}
			} 
			catch (e) {
				done = true;
			}
		}
		prtw.flush();
		
		bufr.close();
		prtw.close();
	})
}

steal.browser.prototype.simpleServer = function(){
	
	var serv = new java.net.ServerSocket(5555);
	while (true) {
		var sock = serv.accept();
		process(sock);
	}
	sock.close();
	serv.close();
}