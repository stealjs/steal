steal(function(){

	var loadScriptText = steal.build.loadScriptText,
	checkText = function(text, id){
		if(!text){
			print("\n!! There is nothing at "+id+"!!")
		}
	},
	getViewText = function( steal, type ){
		var text = loadScriptText(steal.pathFromPage, steal),
			id = steal.id;
			checkText(text, steal.path);
		return jQuery.View.registerScript("ejs", id, text);
	};
	
	// types conversion
	// the idea is for each type to return JavaScript (or css) that
	// should be in its place
	steal.build.types = {
		'text/javascript': function( stl ) {
			
			return loadScriptText(stl.pathFromPage, stl);

		},
		'text/css': function( script ) {
			return loadScriptText(script.pathFromPage, script);
		},
		'text/ejs': function( steal ) {
			return getViewText(steal, "ejs");
		},
		'text/micro': function( script ) {
			return getViewText(steal, "micro");
		},
		'text/jaml': function( script ) {
			return getViewText(steal, "jaml");
		},
		'text/tmpl': function( script ) {
			return getViewText(steal, "tmpl");
		},
		loadScriptText: loadScriptText
	};
	
})
