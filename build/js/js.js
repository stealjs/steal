steal('steal/build', 'steal/parse').then(function( steal ) {

	/**
	 * Builds JavaScripts
	 *
	 * @param {Object} opener the result of a steal.build.open
	 * @param {Object} options options passed to the build script
	 * 
	 *   * __to__  - which folder the production.css files should be put in
	 *   * __quiet__  - tell the compressor to be less abnoxious about sending errors
	 *   * __all__ - compress all scripts
	 * @param {Object} dependencies array of files and the dependencies they contain under the hood
	 */
	var js = (steal.build.builders.js = function( opener, options, dependencies ) {
		options.compressor = options.compressor || "localClosure";
		steal.print("\nBUILDING SCRIPTS --------------- ");
		var start = new Date();
		
		// get the compressor
		var compressor = js.minifiers[options.compressor](),

			// packages that can be compressed somewhere
			packages = {},

			// the current package
			currentPackage = {
				scripts : [],
				src : []
			}, 
			
			// concatenated scripts waiting to be compressed
			currentCollection = [],
			 
			// keep track of lines for error reporting
			currentLineMap = [],
			
			compressCollection = function(currentCollection, currentLineMap){
				// grab the previous currentCollection and compress it, then add it to currentPackage
				if (currentCollection.length) {
					var compressed = currentCollection.join("\n");
					// clean out any remove-start style comments
					compressed = js.clean(compressed);
					compressed = compressor(compressed, true, currentLineMap);
					currentCollection = [];
					return compressed;
				}
			};

		// compress all scripts by default
		if ( true/*options.all*/ ) {
			packages['production.js'] = currentPackage;
		}
		
		// if nothing can't be compressed, compress whole app in one step

		// for each steal we find
		opener.each('js', function( stl, text, i ) {

			var out = stl.rootSrc || "!";
			// if we should ignore it, ignore it
			if ( stl.packaged === false ) {

				steal.print('   not packaging ' + out);
				
				return;
			}
			
			// ignore
			if ( stl.ignore || (options.exclude && options.exclude.indexOf(stl.rootSrc) != -1)) {
				steal.print('   ignoring ' + out);
				return;
			}
			// if it has a src, let people know we are compressing it
			
			steal.print("   " + out);
			

			// get the package, this will be production.js
			var pack = stl['pack'];

			if ( pack ) {
				//if we don't have it, create it and set it to the current package
				if (!packages[pack] ) {
					packages[pack] = {scripts: [], src : []};
				}
				currentPackage = packages[pack];
			}
			
			// if we should compress the script, compress it
			if ( stl.compress !== false || options.all ) {
				currentPackage.scripts.push("'"+stl.rootSrc+"'")
				// put the result in the package
				text += ";\nsteal.loaded('"+stl.rootSrc+"');";
				if(options.compressor === "localClosure"){ // only closure needs lineNumbers
					text = js.clean(text, stl.rootSrc); // have to remove steal.dev stuff for accurate line nbrs
					var lines = text.match(/\n/g).length + 1,
						mapObj = {
							src: stl.rootSrc,
							lines: lines	
						}
					currentLineMap.push(mapObj);
				}
				currentCollection.push(text);
			} 
			else { // compress is false, don't compress it
				var compressed = compressCollection(currentCollection, currentLineMap);
				currentCollection = [];
				currentLineMap = [];
				currentPackage.src.push(compressed);
			
				// add the uncompressed script to the package
				currentPackage.scripts.push("'"+stl.rootSrc+"'");
				currentPackage.src.push(text+";\nsteal.loaded('"+stl.rootSrc+"');");
			}
		});
		
		var compressed = compressCollection(currentCollection, currentLineMap);
		currentCollection = [];
		currentPackage.src.push(compressed);

		steal.print("");

		// go through all the packages
		for ( var p in packages ) {
			if ( packages[p].src.length ) {
				//join them
				var loading = "steal.loading("+packages[p].scripts.join(',')+");\n", 
					dependencyStr = "";
				for (var key in dependencies){
					dependencyStr += "steal({src: '"+key+"', has: ['"+dependencies[key].join("','")+"']});\n";
				}
				var compressed = packages[p].src.join("\n");
				//save them
				new steal.File(options.to + p).save(loading+dependencyStr+compressed);
				var end = new Date(),
					time = (end-start);
				steal.print(time+' MS')
				steal.print("SCRIPT BUNDLE > " + options.to + p);
			}
		}
	});
	
	
}).then('./jsminify');
