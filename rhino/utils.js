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
})()