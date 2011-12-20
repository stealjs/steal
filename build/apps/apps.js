steal('steal/build', function( steal ) {

/**
 * 
 * Files : a map of fileName to :
 * {
 *   path: rootSrc,
 *   apps: [],
 *   dependencies: {},
 *   size: source.length,
 *   packaged: false,
 *   source: source
 * }
 */
	
// { "//foo.js" : {} }

	// recursively goes through steals and their dependencies.
	
	
		
		/**
		 * 
		 * 
		 */
		steal.build.apps = function( list, options ) {
			
			options = steal.opts(options || {}, {
				//compress everything, regardless of what you find
				depth: 1,
				//folder to build to, defaults to the folder the page is in
				to: 1
			});
			// set the compressor globally
			steal.build.compressor = steal.build.builders.scripts.compressors[options.compressor || "localClosure"]();

			//a list of files hashed by their path
			var files = {},

				//keeps track of the packages an app needs
				apps = {},

				//a list of the apps (top most dependencies)
				appFiles = [];

			//set defaults
			options.depth = options.depth || 2;
			options.to = options.to || "packages/"
			// check if path exists
			var dest = steal.File(options.to);
			if(!dest.exists()){
				var dir = dest.dir();
				dest.mkdir();
			}

			//go through, open each app, and make dependency graph
			
			var make = function(app){
				var startFile = app + "/" + steal.File(app).basename() + ".js"

				steal.build.open('steal/rhino/blank.html', {
						startFile: startFile
				}, function(opener){
					
					appFiles.push(  addDependencies(opener.firstSteal.dependencies[1], files, app )  );
					apps[app] = [];

					callNext();
				})
					
				
			},
			i = 0,
			callNext = function(){
				if( i< list.length ) {
					i++;
					make( list[i-1] );
				} else {
					makePackages();
				}
			},
			makePackages = function(){
				print("Making packages")
				//add an order so we can sort them nicely
				
				apps.orderFiles(appFiles);
	
				// will be set to the biggest group
				var pack,
					//the package number
					packageCount = 0,
					/*
					 * Packages that an app should have
					 * {
					 *   'cookbook' : ['packages/0.js']
					 * } 
					 */
					appsPackages = {},
					/*
					 * Files a package has
					 * {
					 *   'packages/0.js' : ['jquery/jquery.js']
					 * }
					 */
					packagesFiles = {};
					;
	
				// make an array for each app in appsPackages
				for(var appName in apps){
					appsPackages[appName] = [];
				}
	
				//while there are files left to be packaged, get the most shared and largest package
				while ((pack = apps.getMostShared(files))) {
					print('\njoining shared by ' + pack.apps.join(", "))
	
					
					var appsName = pack.apps[0],
					// the name of the file we are making.  
					//  If there is only one app it's an app's production.js
					//  If there are multiple apps, it's a package
						saveFile = pack.apps.length == 1 ? 
										appsName + "/production.js" : 
										"packages/" + packageCount + ".js"
					
					// if there's multiple apps (it's a package), add this to appsPackages for each app
					if( pack.apps.length > 1) {
						pack.apps.forEach(function(appName){
							appsPackages[appName].push(saveFile)
						})
					}
					
					// order the files by when they should be included
					var ordered = pack.files.sort(function( f1, f2 ) {
						return f1.order - f2.order;
					});
					
					// add the files to this package
					packagesFiles[saveFile] =[];
					
					// what we will sent to js.makePackage
					var filesForPackaging = []; 
					
					ordered.forEach(function(file){
						packagesFiles[saveFile].push(file.path);
						filesForPackaging.push({
							rootSrc : file.path,
							content: file.source
						})
						print("  " + file.order + ":" + file.path);
					});
					
					// create dependencies object
					var dependencies = {};
					if( pack.apps.length == 1) {
						appsPackages[appsName].forEach(function(packageName){
							dependencies[packageName] = packagesFiles[packageName].slice(0)
						})
					}
					
					//the source of the package
					var source = steal.build.builders.scripts.makePackage(filesForPackaging, dependencies)
	
					
	
					//save the file
					print("saving " + saveFile);
					steal.File(saveFile).save( source );
	
					
					packageCount++;
				}

			};
			callNext();
			
		};
		
		
		// only add files to files, but recurse through fns
	steal.extend(steal.build.apps, {
		/**
		 * 
		 * @param {Object} steel
		 * @param {Object} files - a files mapping object that looks like
		 * 
		 *     {
		 *        "jquery/controller/controller.js" : {
		 *           path: "jquery/controller/controller.js", // path of file
		 *  		 apps: [], // the apps this is on
		 *  		 dependencies: {
		 *  		   "jquery/class/class.js" : {}
		 *  		 }, // 
		 *  		 size: source.length,
		 *  		 packaged: false,
		 *  		 source: source
		 *        }
		 *     }
		 *     
		 * order gets added later
		 * 
		 * @param {Object} app - 
		 */
		addDependencies: function( steel, files, app ) {
			// check if a fn ...
			
			var rootSrc = steel.options.rootSrc,
				buildType = steel.options.buildType;
			
			
			//add self to files
			if ( !files[rootSrc] ) {
				
				print(" compressing " + rootSrc + " ");
				
				//clean and minifify everything right away ...
				if( steel.options.buildType != 'fn' ) {
					// some might not have source yet
					var source = steel.options.text ||  readFile( rootSrc );
					source = steal.build.builders[buildType].clean(source);
					steel.options.text = steal.build.builders[buildType].minify(source);
				}
				
				//need to convert to other types.
	
				files[rootSrc] = {
					steal: steel.options,
					apps: [],
					dependencies: {},
					packaged: false
				}
			}
	
			var data = files[rootSrc];
			// don't add the same app more than once
			if(data.apps.indexOf(app) == -1){
				data.apps.push(app);
			}
			steel.dependencies.forEach(function(dependency){
				if ( dependency.dependencies && 
				     dependency.options.buildType != 'fn' && 
					 !dependency.options.ignore) {
					 	
					data.dependencies[dependency.options.rootSrc] = arguments.callee(dependency, files, app);
				}
			})
			
			return data;
		},
		
		orderFiles: function( appFiles ) {
			var order = 0

			function visit( f ) {
				if ( f.order === undefined ) {
					for ( var name in f.dependencies ) {
						visit( f.dependencies[name] )
					}
					f.order = (order++);
				}
			}
			for ( var d = 0; d < appFiles.length; d++ ) {
				visit(appFiles[d])
			}
		},
		/**
		 * @hide
		 * Goes through the files
		 * @param {Object} files
		 * @return {Object} like:
		 * 
		 * {
		 *   // apps that need this
		 *   apps : ['cookbook','mxui/grid','mxui/data/list'],
		 *   files : [{file1}, {file2}]
		 * }
		 */
		getMostShared: function( files ) {
			
			// an array of objects
			var shared = []; // count
			
			
			// go through each file
			// find the 'most' shared one
			// package that
			for ( var fileName in files ) {
				
				var file = files[fileName];
				
				
				if ( file.packaged ) {
					continue;
				}
				// shared is like:
				// {
				//    1: {
				//       'foo' : 
				//    },
				//    2 : {
				//       'foo,bar' : {totalSize: 1231, files: [], apps: ['foo','bar']}
				//       'bar,car': 
				//    }
				if (!shared[file.apps.length] ) {
					shared[file.apps.length] = {};
				}
				
				//how many apps it is shared in (5?)
				var level = shared[file.apps.length]; 

				var appsName = file.apps.sort().join();



				if (!level[appsName] ) {
					//
					level[appsName] = {
						totalSize: 0,
						files: [],
						apps: file.apps
					};
					
				}
				//add file, the count is how many files are shared among this many apps
				level[appsName].files.push(file);
				level[appsName].totalSize += file.size;
			}
			
			if (!shared.length ) {
				return null;
			}
			//get the most
			var mostShared = shared.pop(),
				mostSize = 0,
				most;
				
				
			for ( var apps in mostShared ) {
				if ( mostShared[apps].totalSize > mostSize ) {
					most = mostShared[apps];
					mostSize = most.totalSize;
				}
			}
			//mark files 
			for ( var i = 0; i < most.files.length; i++ ) {
				var f = most.files[i];
				f.packaged = true;
			}
			return most;
		}
	})
	
		
		
})