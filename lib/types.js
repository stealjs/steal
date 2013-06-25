var fs = require('fs'),
	path = require('path'),
// We can hardcode this for now
	root = fs.realpathSync(__dirname + '/../../');


/*
 * This is needed in a couple of occassions to grab the correct types.
 */
module.exports = {
	"js": function (options, success) {
		if (options.text) {
			eval(text);
		} else {
			require(path.join(root, options.src.path || options.src));
		}
		success();
	},
	win: global
};
