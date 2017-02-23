var stealTools = require("steal-tools");

var promise = stealTools.build({
	main: "main",
	config: __dirname+"/package.json!npm",
	jsonOptions: {
		transform: function(load, json) {
			/*
			 * the npm extension only gives us the following package info
			 * and writes them to the bundled file
			 *
			 * name: pkg.name,
			 * version: pkg.version,
			 * fileUrl: utils.path.isRelative(pkg.fileUrl) ? pkg.fileUrl : utils.relativeURI(context.loader.baseURL, pkg.fileUrl),
			 * main: pkg.main,
			 * system: convert.system(context, pkg, pkg.system, index === 0),
			 * globalBrowser: convert.browser(pkg, pkg.globalBrowser),
			 * browser: convert.browser(pkg, pkg.browser || pkg.browserify),
			 * jspm: convert.jspm(pkg, pkg.jspm),
			 * jam: convert.jspm(pkg, pkg.jam)
			 *
			 * but we can filter out these configs, if necessary...
			 */

			if(json.steal && json.steal.ignoreBrowser === true){
				delete json.browser;
				delete json.steal.ignoreBrowser;
			}

			return json;
		}
	}
},{
	minify: false,
	debug: true
});
