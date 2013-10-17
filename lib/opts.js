/*
 * Exports `opts` 
 */
module.exports = opts;

var isArray = Array.isArray;

/**
 * Converts args or a string into options
 * @param {Object} args
 * @param {Object} options something like 
 * {
 * name : {
 * 	shortcut : "-n",
 * 	args: ["first","second"]
 * },
 * other : 1
 * }
 */
var opts = steal.opts = function( args, options ) {
	if ( typeof args == 'string' ) {
		args = args.split(' ')
	}
	if (!isArray(args) ) {
		return args
	}

	var opts = {};
	//normalizes options
	(function() {
		var name, val, helper
		for ( name in options ) {
			val = options[name];
			if ( isArray(val) || typeof val == 'number' ) {
				options[name] = {
					args: val
				};
			}
			options[name].name = name;
			//move helper
			helper = options[name].helper || name.substr(0, 1);

			options[helper] = options[name]
		}
	})();
	var latest, def;
	for ( var i = 0; i < args.length; i++ ) {
		if ( args[i].indexOf('-') == 0 && (def = options[args[i].substr(1)]) ) {
			latest = def.name;
			opts[latest] = true;
			//opts[latest] = []
		} else {
			if ( opts[latest] === true ) {
				opts[latest] = args[i]
			} else {
				if (!isArray(opts[latest]) ) {
					opts[latest] = [opts[latest]]
				}
				opts[latest].push(args[i])
			}

		}
	}

	return opts;
};
