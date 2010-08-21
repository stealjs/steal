load('steal/rhino/steal.js')

// copy js.bat and js to root and dist
new steal.File("steal/js.bat").copyTo("js.bat", [])
new steal.File("steal/js").copyTo("js", [])

new steal.File("steal/js.bat").copyTo("steal/dist/js.bat", [])
new steal.File("steal/js").copyTo("steal/dist/js", [])

// copy steal to dist
new steal.File("steal/steal.js").copyTo("steal/dist/steal.js", [])

// compress steal.js to steal.production.js
load("steal/rhino/steal.js");
steal.plugins('steal/build','steal/build/scripts',function(){
	var script = readFile('steal/steal.js'), 
		text = steal.build.builders.scripts.clean(script),  
		compressed =  steal.build.builders.scripts.compressors.localClosure()(text, true);
	new steal.File("steal/steal.production.js").save(compressed);
	new steal.File("steal/steal.production.js").copyTo("steal/dist/steal.production.js", [])
});