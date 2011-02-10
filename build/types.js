steal(function(){

	var loadScriptText = steal.build.loadScriptText,
	checkText = function(text, id){
		if(!text){
			print("\n!! There is nothing at "+id+"!!")
		}
	};
	
	// types conversion
	// the idea is for each type to return JavaScript (or css) that
	// should be in its place
	steal.build.types = {
		'text/javascript': function( stl ) {
			
			return loadScriptText(stl.pathFromPage, stl);

		},
		'text/css': function( script ) {
			if ( script.href ) {
				return loadScriptText(script.href, script);
			}
			else {
				return script.text;
			}
		},
		'text/ejs': function( script ) {
			var text = script.text || loadScriptText(script.src),
				id = script.id || script.getAttribute("id");
				checkText(text, script.src || id);
			return jQuery.View.registerScript("ejs", id, text);
		},
		'text/micro': function( script ) {
			var text = script.text || loadScriptText(script.src),
				id = script.id || script.getAttribute("id");
				checkText(text, script.src || id);
			return jQuery.View.registerScript("micro", id, text);
		},
		'text/jaml': function( script ) {
			var text = script.text || loadScriptText(script.src),
				id = script.id || script.getAttribute("id");
				checkText(text, script.src || id);
			return jQuery.View.registerScript("jaml", id, text);
		},
		'text/tmpl': function( script ) {
			var text = script.text || loadScriptText(script.src),
				id = script.id || script.getAttribute("id");
				checkText(text, script.src || id);
			return jQuery.View.registerScript("tmpl", id, text);
		},
		loadScriptText: loadScriptText
	};
	
})
