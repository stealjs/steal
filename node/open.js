var fs = require('fs');
var path = require('path');
// We can hardcode this for now
var root = fs.realpathSync(__dirname + '/../../');

global.steal = {
	types: {
		"js": function (options, success) {
			var text;
			if (options.text) {
				text = options.text;
				success();
			} else {
				var filename = path.join(root, options.id.path || options.id);
				fs.readFile(filename, function (error, data) {
					if (!error) {
						var text = data.toString();
						// check if steal is in this file
						var stealInFile = /steal\(/.test(text);
						if (stealInFile) {
							// if so, load it
							eval(text);
						}
					}
					success();
				});
			}
		},
		"fn": function (options, success) {
			// skip all functions
			success();
		},
		win: global
	}
}
require('../steal.js');

var iterate = function(steals, deps) {
	steals.dependencies.slice(0).forEach(function(steal) {
		steal && iterate(steal, deps);
		if(steal && steal.options) {
			var src = steal.options.id.toString();
			if(deps.indexOf(src) === -1) {
				deps.push(src);
			}
		}
	});
}

module.exports = function (id, cb) {
	var deps = [];

	steal(id);
	steal.one('done', function(rootSteal) {
		iterate(rootSteal, deps);
		cb(deps);
	});
}
