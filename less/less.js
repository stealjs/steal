/**
 * @add steal.static
 */
steal({src: "./less_engine.js",ignore: true},function(){
	
	/**
	 * @function less
	 * @plugin steal/less
	 * <p>Lets you build and compile [http://lesscss.org/ Less ] css styles.</p>
	 * <p>Less is an extension of CSS that adds variables, mixins, and quite a bit more.
	 * You can write css like:
	 * </p>
	 * @codestart css
	 * @@brand_color: #4D926F;
	 * #header {
	 *   color: @@brand_color;
	 * }
	 * h2 {
	 *   color: @@brand_color;
	 * }
	 * @codeend
	 * <h2>Use</h2>
	 * <p>First, create a less file like:</p>
	 * @codestart css
	 * @@my_color red
	 * 
	 * body { color:  @@my_color; }
	 * @codeend
	 * <p>Save this in a file named <code>red.less</code>.</p>
	 * <p>Next, you have to require the <code>steal/less</code> plugin and then use
	 * steal.less to load your less style:
	 * </p>
	 * @codestart
	 * steal('steal/less').then(function(){
	 *   steal.less('red');
	 * });
	 * @codeend
	 *
	 * Loads Less files relative to the current file.  It's expected that all
	 * Less files end with <code>less</code>.
	 * @param {String+} path the relative path from the current file to the less file.
	 * You can pass multiple paths.
	 * @return {steal} returns the steal function.
	 */
	
	steal.type("less css", function(options, original, success, error){
		var pathParts = options.src.split('/');
		pathParts[pathParts.length - 1] = ''; // Remove filename
		new (less.Parser)({
            optimization: less.optimization,
            paths: [pathParts.join('/')]
        }).parse(options.text, function (e, root) {
			options.text = root.toCSS();
			success();
		});
	});
	
	
	//@steal-remove-start

	//@steal-remove-end
})
