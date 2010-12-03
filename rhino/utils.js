/**
 * Rhino utilities
 */
(function(){
	//convert readFile and load
	var oldLoad = load,
		oldReadFile = readFile,
		basePath = java.lang.System.getProperty("basepath");
	
	var pathFromRoot = function(path){
		if (!/^\/\//.test(path) && !/^\w\:\\/.test(path)) {
			path = basePath + "../" + path
		}
		return path;
	}
		
	var oldRunCommand = runCommand;
	/**
	 * @param {Object} cmd something like java bla/here/something.jar -userExtensions something/here.js
	 * @param {Object} transformPath if true, this will take relative paths and add the basePath to it, it will 
	 * also fix the slashes for your OS
	 */
	runCommand = function(cmd, transformPath){
		var fileRegex = /([^\s]|\/)+\.\w+/g // anything with a slash, no space, and a period
		cmd = cmd.replace(fileRegex, pathFromRoot)
		if (java.lang.System.getProperty("os.name").indexOf("Windows") != -1)
			oldRunCommand("cmd", "/C", cmd)
		else
			oldRunCommand("sh", "-c", cmd)
	}
		
	load = function( path ) {
		oldLoad(pathFromRoot(path))
	}
	readFile = function( path ) {
		return oldReadFile(pathFromRoot(path))
	}
})()