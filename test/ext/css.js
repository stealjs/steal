if( steal.config('env') === 'production' ) {
	exports.fetch = function(load) {
		// return a thenable for fetching (as per specification)
		// alternatively return new Promise(function(resolve, reject) { ... })
		var cssFile = load.address;

		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = cssFile;

		document.head.appendChild(link);
		return "";
	};
} else {
	exports.instantiate = function(load) {
		load.metadata.deps = [];
		load.metadata.execute = function(){
			var source = load.source+"/*# sourceURL="+load.address+" */";
			source = source.replace(/url\(['"]?([^'"\)]*)['"]?\)/g, function( whole, part ) {
				return "url(" + steal.joinURIs( load.address, part) + ")";
			});
				
			if(load.source && typeof document !== "undefined") {
				var head = document.head || document.getElementsByTagName('head')[0],
					style = document.createElement('style');

				// make source load relative to the current page
				
				style.type = 'text/css';

				if (style.styleSheet){
					style.styleSheet.cssText = source;
				} else {
					style.appendChild(document.createTextNode(source));
				}
				head.appendChild(style);
			}

			return System.newModule({source: source});
		};
		load.metadata.format = "css";
	};
	
}

exports.buildType = "css";
exports.includeInBuild = true;
