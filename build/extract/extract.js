steal('steal', 'steal/parse', 'steal/build', 'steal/build/pluginify', function(s, parse) {
	var inexcludes = function(excludes, src) {
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
		 * @param {{}} options Options
		 * @param {Function} callback A callback getting passed an array
		 * of steals
		 */
		getDependencies = function(file, excludes, options, callback) {
			s.build.open("steal/rhino/blank.html", {
				startId : file,
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

		convertContents = function(content, options) {
			var wrapper = options.wrapper || function(content) {
					return '(' + content + ')(jQuery);'
				},
				out = s.build.pluginify.getFunction(content, 0, false) + '\n';
			return wrapper(out);
		},

		writeContents = function(content, options, stl) {
			var src = stl.id.toString(),
				parts = src.replace('.' + stl.ext, '').split('/');

			if(parts[parts.length - 1] == parts[parts.length - 2]) {
				parts.pop();
				src = parts.join('/') + '.' + stl.ext
			}

			// We need to take mappings into consideration for the filename as well
			var outFile = new s.File(options.out + '/' + src);
			outFile.dir().mkdirs();
			console.log('Saving to ' + outFile);
			outFile.save(s.build.js.clean(content));
		},

		/**
		 * Creates the actual module recursively
		 *
		 * @param {String} name The name of the main module file
		 * @param {Array} excludes A list of files to exclude
		 * @param {{}} options The options to use
		 */
		createModule = function(name, excludes, options) {
			getDependencies(name, excludes, options, function(steals) {
				steals.forEach(function(stl) {
					var content = convertContents(readFile(stl.id), options);
					writeContents(content, options, stl);
				});
			});
		};

	/**
	 * @function steal.build.extract
	 * @parent steal.build
	 *
	 * @signature `extract(source, options)`
	 * 
	 * @param {String} source The root JavaScript source file name to generate the modules from.
	 * @param {{}} options The options for generating AMD modules. The following options will be used:
	 *
	 * @option The output folder
	 * @option excludes An array of files to exclude (must be the full Steal rootSrc)
	 * @option map A mapping from full Steal rootSrc filenames to the AMD module name.
	 * Any missing folders will be created automatically.
	 * @option names A mapping from AMD module names (as set in `map` or the default)
	 * to parameter variable names.
	 * @option global The global option passed to pluginify
	 * 
	 * @body
	 *
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
	 */
	s.build.extract = function(source, options) {
		var out = options.out;

		rhinoLoader = {
			callback: function(s){
				s.pluginify = true;
			}
		};

		options.exclude = options.exclude || [];
		options.exclude.push('stealconfig.js', 'steal/dev/');

		print('Extracting raw plugin files from ' + source + ' to ' + options.out);
		steal.File(out).mkdirs();
		createModule(source, options.exclude || {}, options);
	}
});