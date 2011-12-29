// open all apps
// go through and mark everything in 'core' as packaged

// indicate which sub-packages each other app needs
// steal({ src: 'packagea', needs: 'abc.js'})

// TODO
//  - make it able to work with specific files


steal('steal/build','steal/build/apps','steal/get/json.js',function(s){
	var apps = steal.build.apps,
		build = steal.build;
	
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
		
		// open the core app
		apps._open(app, options, function(options, opener){
			
			// the folder are build files will go in
			var to = buildOptions.to || s.File(opener.firstSteal.options.rootSrc).dir(),
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
						return s.File(l).filename()
					}).join('-')
					if(!usedNames[shortened]){
						usedNames[shortened] = true;
					return appNamesToName[expanded] = to + "/packages/"+shortened;
					} else {
						return appNamesToName[expanded] = to + "/packages/"+expanded.replace(/\//g,'_') ;
					}
				};
			
			// make the packages folder
			s.File(to+"/packages").mkdirs();
			
			// get packages loaded, packages need to be rootSrc style url
			var packages = opener.steal.packages(),
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
			apps.open(packages, options, function(options){
				
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
					}));
					
					// 
					if(isPackage){
						s.print("  Package: "+packageName)
					} else {
						s.print("  Shared Package: "+packageName)
					}
					
					sharing.files.forEach(function(f){
						print("  + "+f.stealOpts.rootSrc)
					})
					s.print(" ")
					
					s.File(packageName+".js").save( pack.js );
					
					// make this steal instance
					makes[packageName+".js"] = {
						src: packageName+".js",
						needs :[]
					}
					// if we have css
					if(pack.css && pack.css.srcs.length){
						// write
						// tell the js it needs this css
						makes[packageName+".js"].needs.push(packageName+".css")
						// make the css
						makes[packageName+".css"] = {
							src: packageName+".css",
							has: pack.css.srcs
						};
						
					}
					
					shares.push(sharing);
					// add to maps
					if(isPackage){
						// this should be the real file
						maps[sharing.appNames[0]+".js"] = packageName+".js";
					}
				}
				//
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
				print("Making "+to+"/production.js")
				var pack = build.js.makePackage(masterFiles.sort(function( f1, f2 ) {
					return f1.order - f2.order;
				}).map(function(f){return f.stealOpts}));
				
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
				s.File(to+"/production.js").save(
					mapCode+makeCode.join('\n')+"\n"+pack.js
				)
			});
		});
	}
	
	
});
