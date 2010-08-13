steal('//steal/compress/scripts','//steal/compress/cssmin', function(steal){
	var opts = {};
	
	/**
	 * @parent stealtools
	 * compresses an application
	 * @param {String} url an html page to compress
	 * @param {Object} options
	 */
	steal.compressCSS = function(url, options){
		options = steal.opts(options || {}, {
			//compress everything, regardless of what you find
			all : 1,
			//compress to someplace
			to: 1
		})
		
		
		//out is the folder packages will be sent to
		options.out = options.out || (url.match(/https?:\/\//) ?  "" : url.substr(0, url.lastIndexOf('/'))  );
		if (options.out.match(/\\$/) == null && options.out != '') {
			options.out += "/";
		}

		var compressor = steal.cssMin,
			packages = {},
			currentPackage = [];
		
		if(options.all){
			packages[options.to || 'production.js'] = currentPackage;
		}
		
		steal.scripts(url).each('link',function(link, text, i){
			print('here')

			//let people know we are adding it
			if(link.href){
				convert(text, )
				
				print("   " + link.href.replace(/\?.*$/,"").replace(/^(\.\.\/)+/,"")  );
			}
			/*var pack = script.getAttribute('package');
			
			if(pack){
				!packages[pack] && (packages[pack] = []);
				currentPackage = packages[pack];
			}
			
			text = steal.compress.clean(text);
			if(script.getAttribute('compress') == "true" || options.all){
				text =  compressor(text, true);
			}
			currentPackage.push(text);*/
		});
		return;
		//now we should have all scripts sorted by whatever package they should be put in
		print();
		for(var p in packages){
			if(packages[p].length){
				var compressed = packages[p].join(";\n");
				new steal.File(options.out + p).save(compressed);           
				print("Package " + (/*++idx*/ p) + ": " + options.out + p);
			}
		}
		
	}
	
	
	//clean 
	/**
	 * 
	 * @param {Object} css
	 * @param {Object} cssLocation
	 * @param {Object} prodLocation
	 */
	var convert = function(css, cssLocation, prodLocation){
		//how do we go from prod to css
		 
		var cssLoc = new File(cssLocation).dir();
		
		css.replace(/url\(([^\)]*))/g, function(whole, part){
			
			//check if url is relative
			if(! isRelative(part) ) {
				return whole
			}
			//it's a relative path from cssLocation, need to convert to
			// prodLocation
			var fromPage = new File(part).joinFrom(cssLoc),
				fin = new File(fromPage).toReferenceFromSameDomain(prodLocation);
				
			print(part+" -> "+fromPage+ " - > "+fin)
			return fin;
		});
		
		
	},
	isRelative = function(part){
		return !/^(http:\/\/|https:\/\/|\/\.\/|\.\.\/)/.test(part)
	}
	
	
	
})








