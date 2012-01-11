// open all apps
// go through and mark everything in 'core' as packaged

// indicate which sub-packages each other app needs
// steal({ src: 'packagea', needs: 'abc.js'})

// TODO
//  - make it able to work with specific files


steal('steal/build','steal/build/apps','steal/get/json.js',function(s){

	var apps = steal.build.apps,
		build = steal.build, 
		packages =
	
	/**
	 * builds an app, and pulls out packages
	 * @param {Object} app
	 */
	steal.build.packages = function(app, buildOptions){
		
		// options for packaging
		var options = {
			// the files opened
			files : {},
			// each app's first file
			appFiles : [],
			// don't minify at first (will be faster)
			minify : false
		};
		buildOptions = buildOptions || {};
		buildOptions.depth = buildOptions.depth || Infinity;
		// open the core app
		apps._open(app, options, function(options, opener){
			
			// the folder are build files will go in
			var to = buildOptions.to || ""+s.URI(opener.firstSteal.options.rootSrc).dir(),
				appNamesToName = {},
				usedNames = {},
				// a helper function that translates between an 
				// app's name and where we are building it to
				appNamesToMake = function(appNames){
					
					//remove js if it's there
					appNames = appNames.map(function(appName){
						return appName.replace(".js","")
					});
					var expanded = appNames.join('-');
					// check map
					if(appNamesToName[expanded]){
						return appNamesToName[expanded];
					}
					// try with just the last part
					var shortened = appNames.map(function(l){
						return s.URI(l).filename()
					}).join('-')
					if(!usedNames[shortened]){
						usedNames[shortened] = true;
					return appNamesToName[expanded] = to + "/packages/"+shortened;
					} else {
						return appNamesToName[expanded] = to + "/packages/"+expanded.replace(/\//g,'_') ;
					}
				};
			
			// make the packages folder
			s.URI(to+"/packages").mkdirs();
			
			// get packages loaded, packages need to be rootSrc style url
			var packs = opener.steal.packages(),
				// will house the master app's files (so we can build them later)
				masterFiles = [];
				
			// go through every file and mark it packaged
			for(var name in options.files){
				options.files[name].packaged = true;
				masterFiles.push(options.files[name])
			}
			
			// Make the packaged!
			// TODO: figure out how to not write it needs this
			
			// change options for loading packages
			// we don't want to change pages, use the current page
			options.newPage = false;
			
			// minify each file we load
			options.minify = true;
			
			// open packages and add their dependencies 
			apps.open(packs, options, function(options){
				
				// order files 
				apps.order(options);
				
				var sharing,
					// makes contains an hash of packageSrc to
					// the object that we will pass to steal.p.make
					// like:
					//  {
					//    package1 : {src: package1, needs: [shared1]}
					//  }
					// this is used so when the package is stolen,
					// it will load anything it needs before it
					makes = {},
					// mappings of packaged app name to packaging file
					// this is what overwrites the loading location for packages
					maps = {},
					// a list of shares, we go through the list twice
					// b/c it is easier to populate makes
					// once we have gone through each share.
					shares = [];
				
				s.print("Making Packages\n");
				
				while(sharing = apps.getMostShared(options.files)){
					
					// is it a 'end' package
					var isPackage = sharing.appNames.length == 1,
						packageName = appNamesToMake(sharing.appNames);
	
					// create package
					var pack = build.js.makePackage(sharing.files.map(function(f){
						return f.stealOpts;
					})),
						hasCSS = pack.css && pack.css.srcs.length;
					
					// 
					if(isPackage){
						s.print("  Package: "+packageName+ (hasCSS ? " js/css" : "" ) )
					} else {
						s.print("  Shared Package: "+packageName)
					}
					
					sharing.files.forEach(function(f){
						print("  + "+f.stealOpts.rootSrc)
					})
					s.print(" ")
					
					s.URI(packageName+".js").save( pack.js );
					
					// make this steal instance
					makes[packageName+".js"] = {
						src: packageName+".js",
						needs :[]
					}
					// if we have css
					if(hasCSS){
						// write
						// tell the js it needs this css
						makes[packageName+".js"].needs.push(packageName+".css")
						// make the css
						makes[packageName+".css"] = {
							src: packageName+".css",
							has: pack.css.srcs
						};
						s.URI(packageName+".css").save( pack.css.code );
					}
					
					shares.push(sharing);
					// add to maps
					if(isPackage){
						// this should be the real file
						maps[sharing.appNames[0]+".js"] = packageName+".js";
					}
				}
				// handle depth
				
				//packages.flatten(shares, 2);
		
				shares.forEach(function(sharing){
					var isPackage = sharing.appNames.length == 1,
						sharePackageName = appNamesToMake(sharing.appNames);
					
					if(!isPackage){
						// add this as a needs to master
						sharing.appNames.forEach(function(appName){
							var packageName = appNamesToMake([appName])
							makes[packageName+".js"].needs
								.push(sharePackageName+".js")
						})
					}
				});
				// write production with makes
				// and maps
				
				// sort masterFiles
				print("Making "+to+"/production.js");
				
				var pack = build.js.makePackage(
					masterFiles.map(function(f){return f.stealOpts}),
					{},to+"/production.css");
				
				// prepend maps and makes ...
				// make makes
				var makeCode = [],
					mapCode;
				for(name in makes) {
					makeCode.push("steal.p.make(",
						s.toJSON(makes[name]),
						");")
				}
				
				mapCode = "steal.map("+s.toJSON(maps)+");"
				s.URI(to+"/production.js").save(
					build.js.minify( mapCode+makeCode.join('\n')+"\n"+pack.js )
				)
				if(pack.css && pack.css.srcs.length){
					print("       "+to+"/production.css");
					s.URI(to+"/production.css").save( pack.css.code );
				}
			});
		});
	}
	s.extend(packages,{
		/**
		 * Flattens the list of shares until each script has a minimal depth
		 * @param {Object} shares
		 * @param {Object} depth
		 */
		flatten : function(shares, depth){
			while(packages.maxDepth(shares) >= depth){
				var min = packages.min(shares);
				packages.merge(shares, min);
			}
		},
		/**
		 * 
		 * @param {Object} shares
		 * @param {Object} min
		 *     
		 *     diff : diff, 
		 *     a: i, - the 'higher' one that will be merged into
		 *     b: j  - the 'lower' share
		 */
		merge : function(shares, min){
			var lower = shares[min.b],
				upper = shares[min.a];
			// remove old one
			shares.splice(min.a,1);
			
			// merge in files
			lower.files = upper.files.concat(lower.files)
			
			// merge in apps
			var apps = packages.appsHash(lower);
			upper.appNames.forEach(function(appName){
				if(!apps[appName]){
					lower.appNames.push(appName);
				}
			})
		},
		/**
		 * Goes through and figures out which package has the greatest depth
		 */
		maxDepth: function(shares){
			var packageDepths = {},
				max = 0;
			shares.forEach(function(share){
				share.appNames.forEach(function(appName){
					packageDepths[appName] = (packageDepths[appName] ? 1 : packageDepths[appName] +1 );
					max = Math.max(packageDepths[appName], max)
				});
			});
			return max;
		},
		/**
		 * Goes through every combination of shares and returns the one with the smallest difference
		 * @param {Object} shares
		 */
		min: function(shares){
			var min = {diff : Infinity};
			for(var i = 0; i < shares.length; i++){
				var shareA = shares[i];
				
				for(var j = i+1; j < shares.length; j++){
					var shareB = shares[j],
						diff = packages.difference(shareA, shareB);
					if(diff < min.diff){
						min = {
							diff : diff,
							a: i,
							b: j
						}
					}
				}
			}
			return min.diff === Inifinity ? null : min;
		},
		// returns a difference between two shareds
		difference: function(sharedA, sharedB){
			// figure out the files in A that are not in B and vice versa
			
			return packages.diff(sharedA, sharedB) + packages.diff(sharedB, sharedA);
		},
		/**
		 * returns a hash of the app names for quick checking
		 */
		appsHash : function(shared){
			var apps = {};
			shared.appNames.forEach(function(name){
				apps[name] = true;
			})
			return apps
		},
		// return a difference between one share and another
		diff: function(sharedA, sharedB){
			// the apps in A
			var apps = packages.appsHash(sharedA);
			
			// go through b's files, add files that are not in apps
			var size = 0;
			
			sharedB.files.forEach(function(file){
				// check if the file is in an app not in apps
				var inApp = true;
				file.appNames.each(function(appName){
					if(!apps[appName]){
						inApp = false;
					}
				})
				if(!inApp){
					size += file.stealOpts.text.length
				}
			});
			return size;
		}
	})
	
	
});
