var css = require("$css");
var lessEngine = require("less");

exports.instantiate = css.instantiate;

var opts = steal.config('lessOptions') || {},
	parseOpts = opts.parse || {},
	evalOpts = opts.eval || {};

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
		// defaults
		parseOpts.paths |= [pathParts.join('/')];
		parseOpts.optimization |= lessEngine.optimization;

		var Parser = lessEngine.Parser;
		new Parser(parseOpts).parse(load.source, function (e, root) {
			if(e){
				reject(e);
			} else {
				resolve(root.toCSS(evalOpts));
			}
		});
	});
};

exports.buildType = "css";
