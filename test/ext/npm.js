"format cjs";

var utils = require('./npm-utils');
var convert = require("./npm-convert");
var crawl = require('./npm-crawl');
var npmLoad = require("./npm-load");
var isNode = typeof process === "object" &&
	{}.toString.call(process) === "[object process]";

/**
 * @function translate
 * @description Convert the package.json file into a System.config call.
 * @signature `translate(load)`
 * @param {Object} load Load object
 * @return {Promise} a promise to resolve with the load's new source.
 */
exports.translate = function(load){
	var loader = this;
	
	// This could be an empty string if the fetch failed.
	if(load.source == "") {
		return "define([]);";
	}

	var resavePackageInfo = isNode && loader.isEnv &&
		!loader.isEnv("production");
	var prevPackages = loader.npmContext && loader.npmContext.pkgInfo;
	var context = {
		packages: [],
		pkgInfo: [],
		loader: this,
		// places we load package.jsons from
		paths: {},
		// paths that are currently be loaded
		loadingPaths: {},
		versions: {},
		fetchCache: {},
		deferredConversions: {},
		npmLoad: npmLoad,
		crawl: crawl,
		convert: convert,
		resavePackageInfo: resavePackageInfo,
		forwardSlashMap: {},
		// default file structure for npm 3 and higher
		isFlatFileStructure: true
	};
	this.npmContext = context;
	var pkg = {origFileUrl: load.address, fileUrl: utils.relativeURI(loader.baseURL, load.address)};
	crawl.processPkgSource(context, pkg, load.source);
	var pkgVersion = context.versions[pkg.name] = {};
	pkgVersion[pkg.version] = context.versions.__default = pkg;

	// backwards compatible for < npm 3
	var steal = utils.pkg.config(pkg);
	if(steal && steal.npmAlgorithm === "nested") {
		context.isFlatFileStructure = false;
	} else {
		pkg.steal = steal = steal || {};
		steal.npmAlgorithm = "flat";
	}

	return crawl.root(context, pkg, true).then(function(){
		// clean up packages so everything is unique
		var names = {};
		var packages = context.pkgInfo;
		utils.forEach(context.packages, function(pkg, index){
			if(!packages[pkg.name+"@"+pkg.version]) {
				if(pkg.browser){
					delete pkg.browser.transform;
				}
				pkg = utils.json.transform(loader, load, pkg);
				var steal = utils.pkg.config(pkg);

				packages.push({
					name: pkg.name,
					version: pkg.version,
					fileUrl: utils.path.isRelative(pkg.fileUrl) ?
						pkg.fileUrl :
						utils.relativeURI(context.loader.baseURL, pkg.fileUrl),
					main: pkg.main,
					steal: convert.steal(context, pkg, steal, index === 0),
					globalBrowser: convert.browser(pkg, pkg.globalBrowser),
					browser: convert.browser(pkg, pkg.browser || pkg.browserify),
					jspm: convert.jspm(pkg, pkg.jspm),
					jam: convert.jspm(pkg, pkg.jam),
					resolutions: {}
				});
				packages[pkg.name+"@"+pkg.version] = true;
			}
		});

		npmLoad.addExistingPackages(context, prevPackages);
		var source = npmLoad.makeSource(context, pkg);

		return source;
	});
};
