// looks for $modelName and $modelType

(function(){

	var md = $convert($modelName);
	md.type = $modelType
	var app = md.path.replace(/\/models$/,"")
		md.appPath = app;
	
	new Generate(md.path, md, "../generate/templates/")
		.folder()
		.render(md.underscore+".js", "model.ejs")
		
	//if you have an ending models assume we are in standard
	if(/\/models$/.test(md.path)){
		
		new Generate(app, md, "../generate/templates/", false)
			.push('fixtures').folder()
				.render(md.underscore+".get","fixture.ejs")
		    .pop().push('test').push('qunit').folder()
				.render(md.underscore+"_test.js","model_unit_test.ejs")
	}
	/*
	
	
    //add model and fixtures
    if($modelType){
		md.type =  $modelType;
		var p = jQuery.String.underscore( md.type );
		Generate.render("models/" + md.underscore+".js", "../generate/templates/"+p+"_model.ejs", md);
		Generate.render("test/fixtures/" + md.plural+".json.get", "../generate/templates/fixture.ejs", md);
	}else{
		
		Generate.render("models/" + md.underscore+".js", "../generate/templates/model.ejs", md);
		Generate.render("test/fixtures/" + md.plural+".get", "../generate/templates/fixture.ejs", md);
	}
	//add unit tests
    Generate.render("test/unit/" + md.underscore+"_test.js", "../generate/templates/model_unit_test.ejs", md);*/
})()




