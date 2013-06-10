steal({id: "./less_engine.js",ignore: true}, function(){
	// only if rhino and we have less
	if(steal.isRhino && window.less) {
		// Some monkey patching of the LESS AST
		// For production builds we NEVER want the parser to add paths to a url(),
		// the CSS postprocessor is doing that already.
		(function(tree) {
			var oldProto = tree.URL.prototype;
			tree.URL = function (val, paths) {
				if (val.data) {
					this.attrs = val;
				} else {
					this.value = val;
					this.paths = paths;
				}
			};
			tree.URL.prototype = oldProto;
		})(less.tree);
	}

	/**
	 * @page steal.less steal.less
	 * @parent stealjs
	 * @plugin steal/less
	 *
	 * @signature `steal('path/to/filename.less')`
	 *
	 * @param {String} path the relative path from the current file to the coffee file.
	 * You can pass multiple paths.
	 * @return {steal} returns the steal function.
	 * 
	 *
	 * @body
	 * 
	 * Lets you build and compile [http://lesscss.org/ Less ] css styles.
	 * Less is an extension of CSS that adds variables, mixins, and quite a bit more.
	 * 
	 * You can write css like:
	 * 
	 *     @@brand_color: #4D926F;
	 *     #header {
	 *       color: @@brand_color;
	 *     }
	 *     h2 {
	 *       color: @@brand_color;
	 *     }
	 * 
	 * ## Use
	 * 
	 * First, create a less file like:
	 * 
	 *     @@my_color red
	 *    
	 *     body { color:  @@my_color; }
	 *
	 *
	 * Save this in a file named `red.less`.
	 *
	 * Next, you have to add the less entry to the `stealconfig.js` file so it
	 * looks like this:
	 *
	 *     steal.config({
	 *         ext: {
	 *             less: "steal/less/less.js"
	 *         }
	 *     });
	 *
	 * This will automatically load the Less parser when the Less file is
	 * loaded. It's expected that all Less files end with `less`.
	 * 
	 * You can steal the Less file like any other file:
	 *
	 *     steal('filename.less')
	 *
	 */
	steal.type("less css", function(options, success, error){
		var pathParts = (options.src+'').split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename

		var paths = [];
		if (!steal.isRhino) {
			var pathParts = (options.src+'').split('/');
			pathParts[pathParts.length - 1] = ''; // Remove filename
			paths = [pathParts.join('/')];
		}
		new (less.Parser)({
            optimization: less.optimization,
            paths: [pathParts.join('/')]
        }).parse(options.text, function (e, root) {
			options.text = root.toCSS();
			success();
		});
	});
})