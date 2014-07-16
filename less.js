var css = require("$css");
var lessEngine = require("less");

exports.instantiate = css.instantiate;

exports.translate = function(load) {
	var pathParts = (load.address+'').split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename

	var paths = [];
	if (typeof window !== 'undefined') {
		pathParts = (load.address+'').split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename
		paths = [pathParts.join('/')];
	}
	return new Promise(function(resolve, reject){
		new (lessEngine.Parser)({
			optimization: lessEngine.optimization,
			paths: [pathParts.join('/')]
		}).parse(load.source, function (e, root) {
			if(e){
				reject(e);
			} else {
				resolve(root.toCSS());
			}
		});
	});
};

exports.buildType = "css";
