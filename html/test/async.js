steal('steal/html/client.js','jquery').then(function(){
	console.log("one: "+window.location.href)
	steal.html.wait();
	setTimeout(function(){
		console.log("two: "+window.location.hash)
		$(document.body).append("<p>"+window.location.hash+"</p>");
		console.log("three: "+document.documentElement.innerHTML)
		steal.html.ready();
	},10)
	
})
