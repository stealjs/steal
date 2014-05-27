//used to build a page's script
/*global steal : false, Envjs : false, jQuery : false*/

steal('steal',function( steal ) {
	var window = (function() {
		return this;
	}).call(null, 0);

	/**
	 * @parent stealjs
	 * @function steal.build
	 * 
	 * @signature `steal.build( moduleId, options )`
	 *
	 * @param {String} moduleId a JS moduleId or html page that loads steal to build. For example:
	 * 
	 *     steal.build('myapp');
	 * 
	 *     ./js steal/buildjs myapp
	 * 
	 * @param {{}} [options] An object literal with the following optional values:
	 *
	 * @option {String} [to] The folder to put the production.js and production.css files. Ex: `"myproject"`.
	 * 
	 * @option {Boolean} [minify] `true` to minify scripts, `false` if otherwise. Defaults to `true`.
	 * 
	 * @option {Number} [depth] - The total number of packages to load in production if [steal.packages]
	 *  is used. Defaults to `Infinity`.
	 * 
	 * @option {Boolean} [packageSteal] `true` to package stealjs with `production.js`. Defaults to `false`.
	 * 
	 * Example:
	 * 
	 *     steal.build("app",{
	 *       minify: false,
	 *       depth: 3.
	 *       packageSteal: true,
	 *       to: "staticproduction/app"
	 *     })
	 *
	 * @body
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
	 * ## Excluding code from a build.
	 * 
	 * Often, you don't want some code to be run in production. There
	 * are serveral ways to make that happen:
	 * 
	 * ### steal.dev.log
	 * 
	 * [steal.dev.log] can be used as a replacement to console.log. Steal
	 * will remove all lines that look like the following:
	 * 
	 *    steal.dev.log("A message")
	 * 
	 * ### ignore
	 * 
	 * Use [steal.config.shim] to specify that a module should be ignored like:
	 * 
	 *     steal.config({
	 *       shim: {
	 *         "mydebugtool/mydebugtool.js" : {ignore: true}
	 *       }
	 *     })
	 * 
	 * `mydebugtool/mydebugtool.js` will not be loaded in production
	 * 
	 * ### packaged
	 * 
	 * Sometimes you don't want to include some module in production, but you
	 * still want it to load. A common case is loading jQuery from a 
	 * cdn. This can be done by setting `packaged` to false in
	 * shim like:
	 * 
	 *     steal.config({
	 *       shim: {
	 *         "jquery" : {packaged: false}
	 *       },
	 *       {
	 *         paths: {jquery: "http://cdn.com/jquery"}
	 *       }
	 *     })
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
	 * 
	 */
	steal.build = function( moduleId, options ) {

		var dependencies = {}, dep;

		//convert options (which might be an array) into an object
		options = steal.opts(options || {}, {
			//compress everything, regardless of what you find
			all: 1,
			//folder to build to, defaults to the folder the page is in
			to: 1
		});

		// to is the folder packages will be put in
		options.to = options.to || (moduleId.match(/https?:\/\//) ? "" : moduleId.substr(0, moduleId.lastIndexOf('/')));

		// make sure to ends with /
		if ( options.to.match(/\\$/) === null && options.to !== '' ) {
			options.to += "/";
		}

		if(typeof options.minify == "undefined"){
			options.minify = true;
		}

		steal.print("Building to " + options.to);
		steal.build.packages(moduleId, options);

	};



}).then('steal/build/open', 'steal/build/packages');