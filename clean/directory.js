//Directory traversal code taken form: http://www.mailsend-online.com/blog/directory-traversal-in-rhino-javascript.html.

/* Call from the "framework" directory like so:

	./js steal/clean/directory.js path/to/cean
*/

importPackage(java.io);

load("steal/rhino/steal.js");
steal.plugins('steal/clean', function () {

	var jsFiles = [];

	function addJS(fil) {

		var path = fil.getCanonicalPath();

		if (path.match(/\.js$/)){
			jsFiles.push(path);
		}
	}

	function getJSFiles(dir, dirHandler) {
		var lst = new File(dir).listFiles(), i;
		for(i=0;i<lst.length;i++) {

			if(lst[i].isDirectory()) {
				getJSFiles(lst[i].getCanonicalPath(), dirHandler || null);
			}

			dirHandler(lst[i]);
		}
	}

	getJSFiles(_args[0] || './', addJS);
	
	_args.shift();

	for (var i = 0; i < jsFiles.length; i++){
		steal.clean(jsFiles[i], _args)
	}

});