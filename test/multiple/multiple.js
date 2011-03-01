// tests loading multiple apps
steal.plugins('jquery')
	.then(function(){
		APP1 = true;
		setTimeout(function(){
			steal.plugins('//steal/test/multiple/app2')
		}, 1000)
	})