// looks for $controllerName

(function(){

	var ct = $convert($controllerName);
	var app = ct.path.replace(/\/controllers$/,"")
		ct.appPath = app;
	
	new Generate(ct.path, ct, "../generate/templates/")
		.folder()
		.render(ct.underscore+"_controller.js", "controller.ejs")
		
})()




