var fs = require('fs');
var path = require('path');
// We can hardcode this for now
var root = fs.realpathSync(__dirname + '/../../');

(function (win) {
	// we are going to need to swap this out while loading the scripts
	// it's possible a new version of steal will need to be loaded / replace the old one
	// we will have to check the file to see if it is "stealing" anything
	// if it is .. run, but we also need to convert the fn type to not actually call anything
	// this will create a shell
	win.steal = {
		types: {
			"js": function (options, success) {
				if (options.text) {
					eval(text);
				} else {
					require(path.join(root, options.src.path || options.src));
				}
				success();
			},
			win: win
		}
	}

	require('../steal.js');
	//	load("steal/rhino/file.js");
	module.exports = win.steal;
})(global);
