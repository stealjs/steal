var loader = require("@loader");

var isNode = typeof process === "object" && {}.toString.call(process) ===
	"[object process]";
var importRegEx = /@import [^uU]['"]?([^'"\)]*)['"]?/g;
var resourceRegEx =  /url\(['"]?([^'"\)]*)['"]?\)/g;
	
var waitSeconds = (loader.cssOptions && loader.cssOptions.timeout)
	? parseInt(loader.cssOptions.timeout, 10) : 60;
var noop = function () {};
var onloadCss = function(link, cb){
	var styleSheets = document.styleSheets,
		i = styleSheets.length;
	while( i-- ){
		if( styleSheets[ i ].href === link.href ){
			return cb();
		}
	}
	setTimeout(function() {
		onloadCss(link, cb);
	});
};

if(isProduction()) {
	exports.fetch = function(load) {
		// inspired by https://github.com/filamentgroup/loadCSS

		var styleSheets = document.styleSheets;

		// wait until the css file is loaded
		return new Promise(function(resolve, reject) {
			var timeout = setTimeout(function() {
				reject('Unable to load CSS');
			}, waitSeconds * 1000);

			// if found a stylesheet with the same address
			// resolve this promise without adding a link element to the page.
			for (var i = 0; i < styleSheets.length; ++i) {
				if(load.address === styleSheets[i].href){
					resolve('');
					return;
				}
			}

			var link = document.createElement('link');
			link.type = 'text/css';
			link.rel = 'stylesheet';
			link.href = load.address;

			var loadCB = function(event) {
				clearTimeout(timeout);
				link.removeEventListener("load", loadCB);
				link.removeEventListener("error", loadCB);

				if(event && event.type === "error"){
					reject('Unable to load CSS');
				} else {
					resolve('');
				}
			};

			// This code is for browsers that don’t support onload
			// No support for onload (it'll bind but never fire):
			//	* Android 4.3 (Samsung Galaxy S4, Browserstack)
			//	* Android 4.2 Browser (Samsung Galaxy SIII Mini GT-I8200L)
			//	* Android 2.3 (Pantech Burst P9070)
			// Weak inference targets Android < 4.4 and
			// a fallback for IE 8 and beneath
			if( "isApplicationInstalled" in navigator || !link.addEventListener) {
				// fallback, polling styleSheets
				onloadCss(link, loadCB);
			} else {
				// attach onload event for all modern browser
				link.addEventListener( "load", loadCB );
				link.addEventListener( "error", loadCB );
			}

			document.head.appendChild(link);

			// if after appending link styleSheet and the length is still 0 we call always loadCB()
			// this is a bad workaround for the Zombie.js browser
			if(document.styleSheets.length === 0) {
				loadCB();
			}
		});
	};

} else {

	exports.instantiate = function(load) {
		var loader = this;

		// Replace @import's that don't start with a "u" or "U" and do start
		// with a single or double quote with a path wrapped in "url()"
		// relative to the page
		load.source = load.source.replace(importRegEx, function(whole, part) {
			if(isNode) {
				return "@import url(" + part + ")";
			}else{
				return "@import url(" + steal.joinURIs( load.address, part) + ")";
			}
		});


		load.metadata.deps = [];
		load.metadata.execute = function(){

			var source = load.source+"/*# sourceURL="+load.address+" */";
			source = source.replace(resourceRegEx, function(whole, part) {
				return "url(" + steal.joinURIs( load.address, part) + ")";
			});

			if(load.source && typeof document !== "undefined") {
				var doc = document.head ? document : document.getElementsByTagName ?
					document : document.documentElement;

				var head = doc.head || doc.getElementsByTagName('head')[0],
					style = document.createElement('style');

				if(!head) {
					var docEl = doc.documentElement || doc;
					head = document.createElement("head");
					docEl.insertBefore(head, docEl.firstChild);
				}

				// make source load relative to the current page
				style.type = 'text/css';

				if (style.styleSheet){
					style.styleSheet.cssText = source;
				} else {
					style.appendChild(document.createTextNode(source));
				}
				head.appendChild(style);

				if(loader.has("live-reload")) {
					var cssReload = loader["import"]("live-reload", { name: "$css" });
					Promise.resolve(cssReload).then(function(reload){
						loader["import"](load.name).then(function(){
							reload.once(load.name, function(){
								head.removeChild(style);
							});
						});
					});
				}
			}

			return System.newModule({source: source});
		};
		load.metadata.format = "css";
	};

}

function isProduction(){
	return (loader.isEnv && loader.isEnv("production")) ||
		loader.env === "production";
}
exports.locateScheme = true;
exports.buildType = "css";
exports.includeInBuild = true;
