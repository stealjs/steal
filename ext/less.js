var css = require("$css");
var lessEngine = require("less");

exports.instantiate = css.instantiate;

var options = steal.config('lessOptions') || {};

// default optimization value.
options.optimization |= lessEngine.optimization;

exports.translate = function(load) {
	var address = load.address.replace(/^file\:/,"");

	var pathParts = (address+'').split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename

	var paths = [];
	if (typeof window !== 'undefined') {
		pathParts = (load.address+'').split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename
		paths = [pathParts.join('/')];
	}

	return new Promise(function(resolve, reject){
		options.filename = address;
		options.paths = [pathParts.join('/')];

		var done = function(output) {
			resolve(output.css);
		};

		var fail = function(error) {
			reject(error);
		};

		lessEngine.render(load.source, options).then(done, fail);
	});
};

exports.buildType = "css";
