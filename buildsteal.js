importPackage(java.io);

function writeFile( file, stream ) {
	var buffer = new PrintWriter( new FileWriter( file ) );
	buffer.print( stream );
	buffer.close();
}

var core = readFile('steal/core/core.js');

core = core.replace(/\/\*#\s+(.*?)\s+#\*\//g, function(match, filename){
	var filename = 'steal/core/' + filename;
	var file = new java.io.File(filename);
	if(!file.exists()){
		throw "File " + filename + " doesn't exist";
	}
	return readFile(filename);
})

writeFile('steal/steal.js', core)
