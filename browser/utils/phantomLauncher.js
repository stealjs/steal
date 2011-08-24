(function(){
	var url = phantom.args[0],
		page = new WebPage(),
		verbose = phantom.args[1];
	if (verbose && verbose == "-verbose") {
		page.onConsoleMessage = function(msg){
			console.log(msg);
		};
	}
	page.onResourceRequested = function (req) {
//		console.log('Request ' + JSON.stringify(req, undefined, 4));
	};
	page.onAlert = function(msg){
		if(msg=="phantomexit"){
			phantom.exit()
		}
	};
	page.open(url)
	// onLoadFinished fires twice for some reason, we're forcing it to fire only once
	// TODO figure out why it fires twice
	var loadFired = false;
	page.onLoadFinished = function(){
		if(loadFired) return;
		loadFired = true;
		page.injectJs("pclient.js")
	}
})()