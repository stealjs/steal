steal('steal/html/client.js','jquery').then(function(){
	steal.html.wait();
	var showHash = function(){
		$('#out').html("<p>"+window.location.hash+"</p>");
		steal.html.ready();
	}
	setTimeout(function(){
		showHash();
	},10)
	$(window).bind('hashchange', function(){
		showHash();
	})
	
})
