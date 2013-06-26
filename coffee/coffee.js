steal({
	id: "./coffee-script.js",
	ignore: true
}, function(CoffeeScript) {

	/**
	 * @page steal.coffee steal.coffee
	 * @parent stealjs
	 * @plugin steal/coffee
	 *
	 * @signature `steal('path/to/filename.coffee')`
	 *
	 * @param {String} path the relative path from the current file to the coffee file.
	 * You can pass multiple paths.
	 * @return {steal} returns the steal function.
	 *
	 * @body
	 * Requires a [CoffeeScript](http://jashkenas.github.com/coffee-script/) script.
	 * 
	 * CoffeeScript is a more 'refined' version of JavaScript that lets you write code like:
	 *
	 *     number = -42 if opposite
	 *
	 * CoffeeScript is normally used on the server, but steal lets you load CoffeeScripts
	 * in the browser, and compress their JavaScript output into your production builds.
	 * 
	 * ## Use
	 * 
	 * First, create a coffee script like:
	 *
	 *     console.log "There are no () around this string!"
	 * 
	 * Save this in a file named `log.coffee`.
	 * 
	 * Next, you have to add the coffee script entry to the `stealconfig.js` file so it
	 * looks like this:
	 *
	 *     steal.config({
	 *         ext: {
	 *             coffee: "steal/coffee/coffee.js"
	 *         }
	 *     });
	 *
	 * This will automatically load the CoffeeScript parser when the CoffeeScript file is
	 * loaded. It's expected that all CoffeeScript files end with `coffee`.
	 *
	 * You can steal the CoffeeScript file like any JavaScript file:
	 *
	 *     steal('filename.coffee')
	 */
	
	steal.type("coffee js", function(options, success, error){
		options.text = CoffeeScript.compile(options.text);
		success();
	});


})