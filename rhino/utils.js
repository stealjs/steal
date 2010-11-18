/**
 * Rhino utilities
 */
(function(){
	var oldRunCommand = runCommand;
	runCommand = function(cmd){
		if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1)
			oldRunCommand("cmd", "/C", cmd)
		else
			oldRunCommand("sh", "-c", cmd)
	}
	
	//convert readFile and load
	var oldLoad = load,
		oldReadFile = readFile,
		basePath = java.lang.System.getProperty("basepath");
		
	load = function( path ) {
		if (!/^\/\//.test(path) && !/^\w\:\\/.test(path)) {
			path = basePath + "../" + path
		}
		oldLoad(path)
	}
	readFile = function( path ) {
		if (!/^\/\//.test(path) && !/^\w\:\\/.test(path)) {
			path = basePath + "../" + path
		}
		return oldReadFile(path)
	}
})()