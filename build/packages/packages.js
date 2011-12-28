// open all apps
// go through and mark everything in 'core' as packaged

// indicate which sub-packages each other app needs
// steal({ src: 'packagea', needs: 'abc.js'})
steal('steal/build','steal/build/apps','steal/get/json.js',function(s){
	var apps = steal.build.apps,
		build = steal.build;
		
	steal.build.packages = function(app){
		
		//open app
		var options = {
			files : {},
			appFiles : [],
			minify : false // TODO
		}
		var out = app.replace(/\/[^\/]+$/,"")+"/";
		s.File(out+"packages").mkdirs();
		apps._open(app, options, function(options, opener){
			// now get pacakges
			print('opened')
			var packages = opener.steal.packages(),
				masterFiles = [];
			print('packages '+packages.join(','))
			// go through every file and mark it packaged
			for(var name in options.files){
				options.files[name].packaged = true;
				masterFiles.push(options.files[name])
			}
			
			// Make the packaged!
			// TODO: figure out how to not write it needs this
			
			// make it not open
			options.newPage = false;
			//options.minify = true;
			
			// open other files and add to 
			apps.open(packages, options, function(options){
				// print out the current state
				
				apps.order(options)
				var sharing,
					makes = {},
					maps = {},
					appNamesToMake = function(appNames){
						 return out + "packages/"+
									appNames.join('-')
									.replace(/\//g,'_') 
					},
					shares = [];
				
				
				while(sharing = apps.getMostShared(options.files)){
					
					var isPackage = sharing.appNames.length == 1,
						packageName = appNamesToMake(sharing.appNames);
	
					// create package
					print("  - "+packageName)
					var pack = build.js.makePackage(sharing.files.map(function(f){
						return f.stealOpts;
					}));
					
					s.File(packageName+".js").save( pack.js );
					
					makes[packageName+".js"] = {
						src: packageName+".js",
						//has: sharing.files.map(function(f){
						//	return f.stealOpts.rootSrc
						//}),
						needs :[]
					}
					if(pack.css && pack.css.srcs.length){
						// write
						
						makes[packageName+".js"].needs.push(packageName+".css")
						makes[packageName+".css"] = {
							src: packageName+".css",
							has: pack.css.srcs
						};
						
					}
					// add to needs if css
					shares.push(sharing);
					if(isPackage){
						maps[sharing.appNames[0]+".js"] = packageName+".js";
					}
				}
				//
				shares.forEach(function(sharing){
					var isPackage = sharing.appNames.length > 1,
						sharePackageName = appNamesToMake(sharing.appNames);
					
					if(isPackage){
						print("P:"+sharePackageName)
						// add this as a needs to master
						sharing.appNames.forEach(function(appName){
							var packageName = appNamesToMake([appName])
							print(" "+appName+" needs "+sharePackageName)
							makes[packageName+".js"].needs
								.push(sharePackageName+".js")
						})
					}
				});
				// write production with makes
				// and maps
				
				// sort masterFiles
				
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
				s.File(out+"production.js").save(
					mapCode+makeCode.join('\n')+"\n"+pack.js
				)
			});
		});
	}
	
	
});
