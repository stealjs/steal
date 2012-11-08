steal('steal', 'steal/build', 'steal/build/pluginify', function(s) {
	var contents = {},
	modules = {},
	inexcludes = function(excludes, src) {
		for (var i = 0; i < excludes.length; i++) {
			if ((excludes[i].substr(-1) === "/" && src.indexOf(excludes[i]) === 0)
				|| src == excludes[i]) {
				return true;
			}
		}
		return false;
	},
	/**
	 * Returns a list of steal dependencies for a given file and caches
	 * the plain content.
	 *
	 * @param {String} file The JavaScript file to load
	 * @param {Array} excludes A list of dependencies to exclude
	 * @param {Object} options Options
	 * @param {Function} callback A callback getting passed an array
	 * of steals
	 */
	getDependencies = function(file, excludes, options, callback) {
		s.build.open("steal/rhino/blank.html", {
			startFile : file,
			skipAll: true
		}, function(opener){
			var ret = [];
			opener.each(function(stl) {
				if(!inexcludes(excludes || [], stl.id.toString())) {
					ret.push(stl);
				} else {
					print('Ignoring ' + stl.id);
				}
			});
			callback(ret);
		}, null);
	},
	/**
	 * Creates the actual module recursively
	 *
	 * @param {String} name The name of the main module file
	 * @param {Array} excludes A list of files to exclude
	 * @param {Object} options The options to use
	 */
	createModule = function(name, excludes, options) {
		getDependencies(name, excludes, options, function(steals) {
			steals.forEach(function(stl) {
				var content = readFile(stl.id);
				var wrapper = "define([";
				// content.replace(/steal\(['"].*function\(/,)
				content = content.replace('steal', 'define');
				var outFile = new s.File(options.out + stl.id.toString().substring(stl.id.toString().lastIndexOf('/'), stl.id.toString().length));
				console.log('Saving to ' + outFile);
				outFile.save(content);
			});
//			var content,
//				dependencies = [],
//				names = [],
//				nameMap = options.names || {},
//				map = options.map || {},
//				where = getFile(options.out + (map[name] || name));
//
//			print('  > ' + name + ' -> ' + (map[name] || name));
//
//			steals.forEach(function(stl) {
//				console.log(stl.id);
//				var current = (map[stl.id.toString()] || stl.id.toString());
//				if(stl.id.toString() !== name) { // Don't include the current file
//					if(!modules[stl.id.toString()] && !inexcludes(excludes, stl.id.toString())) {
//						createModule(stl.id.toString(), excludes, options);
//					}
//					dependencies.push("'" + current + "'");
//					names.push(nameMap[current] || variableName(current));
//				}
//			});
//
//			content = "define([" +
//				dependencies.join(',') +
//				'], function(' +
//				names.join(', ') +
//				') { \n' +
//				(contents[name] || (' return ' + (options.global || '{}'))) +
//				';\n})';
//
//			modules[name] = content;
//
//			new steal.File(where.dir()).mkdirs();
//			where.save(content);
		});
	};

	/**
	 * Creates a set of AMD modules recursively. The `map` options contain a mapping from Steal
	 * rootSrc filenames to AMD module names. For examples:
	 *
	 *      { "jquery/dom/compare/compare.js" : "jquerypp/compare" }
	 *
	 * Will map "jquery/dom/compare/compare.js" to "jquerypp/compare.js" in the output folder
	 * and all dependencies as well (e.g. dependent files would `define(['jquery/compare'], ...)`.
	 * By default it will use the Steal rootSrc name.
	 * The `names` mapping can be used to map AMD module names to variable names passed to the
	 * pluginified function. By default this will be the filename without extension, `__` prefixed and
	 * `.` converted to `_` (looking like `define(['jquery/compare`], function(__compare) { ... })`).
	 *
	 * @param {String} source The root JavaScript source file name to generate the modules from.
	 * @param {Object} options The options for generating AMD modules.
	 * The following options will be used:
	 *
	 * - `out` - The output folder
	 * - `excludes` - An array of files to exclude (must be the full Steal rootSrc)
	 * - `map` - A mapping from full Steal rootSrc filenames to the AMD module name.
	 * Any missing folders will be created automatically.
	 * - `names` - A mapping from AMD module names (as set in `map` or the default)
	 * to parameter variable names.
	 * - `global` - The global option passed to pluginify
	 */
	s.build.amdify = function(source, options) {
		var out = options.out;

		rhinoLoader = {
			callback: function(s){
				s.pluginify = true;
			}
		};

		options.exclude = options.exclude || [];
		options.exclude.push('stealconfig.js', 'steal/dev/');

		print('Creating AMD modules for ' + source + " in " + options.out);
		steal.File(out).mkdirs();
		createModule(source, options.exclude || {}, options);
	}
});