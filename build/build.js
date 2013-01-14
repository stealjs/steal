//used to build a page's script
/*global steal : false, Envjs : false, jQuery : false*/

steal('steal',function( steal ) {
	var window = (function() {
		return this;
	}).call(null, 0);

	/**
	 * @parent stealjs
	 *
	 * `steal.build(moduleId, options)` builds a JavaScript module along 
	 * with all of its dependencies. It also builds any packages specified
	 * by [steal.packages]. 
	 * 
	 * Calling steal's build in rhino might look like:
	 * 
	 *     steal.build('myproject/myproject.js',{
	 *       to: "myproject",
	 *       depth: 4
	 *     });
	 * 
	 * This could be run on the command-line like:
	 * 
	 *     ./js steal/buildjs myproject -to "myproject" -depth 4
	 * 
	 * If you used the app [steal.generate generator] to create
	 * an application, build your project like:
	 * 
	 *     ./js myproject/script/build.js
	 * 
	 * Use [steal.build.apps] to build multiple applications at once
	 * and group shared dependencies into cache-able scripts.
	 * 
	 * 
	 * 
	 *
	 * <h2>Building with steal.js.</h2>
	 * <p>Building with steal is easy, just point the <code>steal/buildjs</code> script at your page and
	 * give it the name of your application folder:</p>
	 * @codestart no-highlight
	 * js steal/buildjs path/to/page.html -to myapp
	 * @codeend
	 * <p>If you generated a steal app or plugin, there's a handy script already ready for you:</p>
	 * @codestart no-highlight
	 * js myapp/scripts/build.js
	 * @codeend
	 * <h2>Building without steal.js</h2>
	 * You can compress and package any page's JavaScript by adding <code>compress="true"</code>
	 * attributes to your script tag like the following:
	 * @codestart html
	 * &lt;script src="file1.js" type="text/javascript" compress="true">&lt;/script>
	 * &lt;script src="file2.js" type="text/javascript" compress="true">&lt;/script>
	 * @codeend
	 * and then running either:
	 * @codestart no-highlight
	 * js steal/buildjs path/to/page.html -to [OUTPUT_FOLDER]
	 * @codeend
	 * or:
	 * @codestart no-highlight
	 * js steal/buildjs http://hostname/path/page.html -to [OUTPUT_FOLDER]
	 * @codeend
	 * This will compress file1.js and file2.js into a file package named production.js an put it in OUTPUT_FOLDER.
	 *
	 * 
	 * ## Trouble-shooting
	 * 
	 * `steal.build` uses EnvJS to simulate a html page and DOM for your 
	 * scripts to run inside. EnvJS is not a full featured browser and
	 * the page might not be similar to the pages your app's code
	 * runs inside. Fortunately, the fixes are easy:
	 * 
	 * __Prevent DOM manipulations, Ajax calls, or setTimeout's before onload
	 * 
	 * The easist way to do this is to surround this code with an `if(steal.isRhino)`
	 * like:
	 * 
	 *     if( steal.isRhino ) {
	 *       $.get("/user/current", function(){  ... })
	 *     }
	 * 
	 * __Feature detect calling Canvas and other HTML5 APIs__
	 * 
	 * Instead of doing:
	 * 
	 *     canvas.getContext('2d');
	 * 
	 * Write
	 * 
	 *     if( canvas.getContext ) {
	 * 	     canvas.getContext('2d')
	 *     }
	 * 
	 * _The next version of StealJS will not have this problem._
	 * 
	 * 
	 * @param {String} url a JS moduleId or html page that loads steal to build.
	 * 
	 * @param {Object} options An object literal with the following optional values:
	 * 
	 *  - to - The folder to put the production.js and production.css files. Ex: `"myproject"`.
	 *  - minify - `true` to minify scripts, `false` if otherwise. Defaults to `true`.
	 *  - depth - The total number of packages to load in production if [steal.packages]
	 *            is used. Defaults to `Infinity`
	 *  - packageSteal - `true` to package stealjs with `production.js`. Defaults to `false`.
	 */
	steal.build = function( url, options ) {

		var dependencies = {}, dep;

		//convert options (which might be an array) into an object
		options = steal.opts(options || {}, {
			//compress everything, regardless of what you find
			all: 1,
			//folder to build to, defaults to the folder the page is in
			to: 1
		});

		// to is the folder packages will be put in
		options.to = options.to || (url.match(/https?:\/\//) ? "" : url.substr(0, url.lastIndexOf('/')));

		// make sure to ends with /
		if ( options.to.match(/\\$/) === null && options.to !== '' ) {
			options.to += "/";
		}

		if(typeof options.minify == "undefined"){
			options.minify = true;
		}

		steal.print("Building to " + options.to);
		steal.build.packages(url, options);

	};



}).then('steal/build/open', 'steal/build/packages');