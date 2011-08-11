// listens for 3001, returns something super simple

steal.browser.prototype.simpleServer = function(){
	
	var serv = new java.net.ServerSocket(5555),
		sock, copiedsock;
	while (true) {
		var sock = serv.accept();
		spawn(function(){
			var mysock = sock;
			var bufr = new java.io.BufferedReader(new java.io.InputStreamReader(mysock.getInputStream()));
			
			var prtw = new java.io.PrintWriter(mysock.getOutputStream(), false); // no autoFlush
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
//							print(params[1])
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
	sock.close();
	copiedsock.close();
	serv.close();
}