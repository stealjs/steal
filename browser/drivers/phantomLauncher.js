(function(){
	var url = phantom.args[0],
		page = new WebPage();
	page.onConsoleMessage = function (msg) {
//	    console.log(msg);
	};
	page.onAlert = function(msg){
		if(msg=="phantomexit"){
			phantom.exit()
		}
	};
	page.open(url);
})()