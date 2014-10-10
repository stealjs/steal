var css = require("$css");
var lessEngine = require("less");

exports.instantiate = css.instantiate;

exports.translate = function(load) {

	// make options private, because we may change them
	var options = steal.extend({}, steal.config('lessOptions') || {});

	// default optimization value.
	options.optimization |= lessEngine.optimization;

	// paths option is used only in node.js
	if (typeof window === 'undefined') {

		var pathParts = (load.address + '').split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename
		// allow to have custom paths in options and add path
		options.paths = (options.paths || []).concat(pathParts.join('/'));
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