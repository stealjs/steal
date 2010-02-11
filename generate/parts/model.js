// looks for $modelName and $modelType

(function(){
	Generate.folder("models");
	var md = $convert($modelName);
	
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
    Generate.render("test/unit/" + md.underscore+"_test.js", "../generate/templates/model_unit_test.ejs", md);
})()




