steal('steal/html','jquery').then(function(){
	steal.html.wait();
	setTimeout(function(){
		$(document.body).append("<p>"+window.location.hash+"</p>");
		steal.html.ready();
	},10)
	
})
