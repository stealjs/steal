var fs = require('fs'),
	path = require('path');

/*
 * This is needed in a couple of occassions to grab the correct types.
 */
module.exports = {
	"js": function (options, success) {
		if (options.text) {
			eval(text);
		} else {
			var root = steal.config().baseUrl;
			require(path.resolve(root, options.src.path || options.src));
		}
		success();
	},
	win: global
};
