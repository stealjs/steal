var css = require("$css");
var lessEngine = require("less");

exports.instantiate = css.instantiate;

var options = steal.config('lessOptions') || {};

// default optimization value.
options.optimization |= lessEngine.optimization;

exports.translate = function(load) {

	// paths option is used only in node.js
	if (typeof window === 'undefined') {

		var sep = (load.address + '').indexOf('\\') > 0 ? '\\' : '/' // determine path separator

		var pathParts = (load.address +'' ).split(sep);
		pathParts[pathParts.length - 1] = ''; // Remove filename
		// allow to have custom paths in options and add path
		options.paths = (options.paths || []).concat(pathParts.join(sep));
	}
	return new Promise(function(resolve, reject){


		var Parser = lessEngine.Parser;
		new Parser(options).parse(load.source, function (e, root) {
			if(e){
				reject(e);
			} else {
				resolve(root.toCSS(options));
			}
		});
	});
};

exports.buildType = "css";