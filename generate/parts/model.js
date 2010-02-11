// looks for $modelName and $modelType

(function(){
	Generator.createFolder("models");
	var md = $convert($modelName);
	
    //add model and fixtures
    if($modelType){
		md.type =  $modelType;
		var p = jQuery.String.underscore( md.type );
		Generator.renderTo("models/" + md.underscore+".js", "../generate/templates/"+p+"_model.ejs", md);
		Generator.renderTo("test/fixtures/" + md.plural+".json.get", "../generate/templates/fixture.ejs", md);
	}else{
		Generator.renderTo("models/" + md.underscore+".js", "../generate/templates/model.ejs", md);
		Generator.renderTo("test/fixtures/" + md.plural+".get", "../generate/templates/fixture.ejs", md);
	}
	//add unit tests
    Generator.renderTo("test/unit/" + md.underscore+"_test.js", "../generate/templates/model_unit_test.ejs", md);
})()




