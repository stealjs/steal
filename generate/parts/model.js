// looks for $modelName and $modelType

(function(){

	var md = $convert($modelName);
	md.type = $modelType
	
	var app = md.path.replace(/\/models$/,"")
		md.appPath = app;
	
	var template = "model.ejs";
	if(md.type && md.type === "JsonRest") template = "json_rest_model.ejs";
	new Generate(md.path, md, "../generate/templates/")
		.folder()
		.render(md.underscore+".js", template)
		
	//if you have an ending models assume we are in standard
	if(/\/models$/.test(md.path)){
		
		new Generate(app, md, "../generate/templates/", false)
			.push('fixtures').folder()
				.render(md.plural+".json.get","fixture.ejs")
		    .pop().push('test').push('qunit').folder()
				.render(md.underscore+"_test.js","model_unit_test.ejs")
	}
})()




