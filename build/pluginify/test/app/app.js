steal("./template.ejs", './style.less',function(temp){
 	
 	document.body.appendChild(temp({message: "Hello World"}));
 	window.APP_ON = true
 })
