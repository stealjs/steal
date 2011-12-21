steal('steal/build', function( steal ) {

/**
 * 
 * ### shared
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
			//set defaults
			options.depth = options.depth || 2;
			options.to = options.to || "packages/"
			// check if path exists
			var dest = steal.File(options.to);
			if(!dest.exists()){
				var dir = dest.dir();
				dest.mkdir();
			}
			
			//a list of files hashed by their path
			var files = {},

				//keeps track of the packages an app needs
				appNames = [],

				//a list of the apps (top most dependencies)
				appFiles = [];

			

			//go through, open each app, and make dependency graph
			
			var make = function(appName){
				var startFile = appName + "/" + steal.File(appName).basename() + ".js"

				steal.build.open('steal/rhino/blank.html', {
						startFile: startFile
				}, function(opener){
					
					appFiles.push(  addDependencies(opener.firstSteal.dependencies[1], files, appName )  );
					appNames.push(appName);

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
			;
			callNext();
			
		};
		
		
		// only add files to files, but recurse through fns
	steal.extend(steal.build.apps, {
		/**
		 * Gets a steal instance and recursively sets up a __files__ object with 
		 * __file__ objects for each steal that represents a resource (not a function).
		 * 
		 * A __file__ object is a recursive mapping of a steal 
		 * instances's options and dependencies.  Different apps have different
		 * steal instances for the same resource.  This _should_ be merging those attributes
		 * and maintaining a collection of the apps the file exists on.
		 * 
		 *     {
		 *       // the apps this steal is on
		 *       appsNames: [], 
		 *       dependencyFileNames: [ "jquery/class/class.js" ], 
		 *       packaged: false,
		 *       stealOpts: steal.options
		 *     }
		 * 
		 * A __files__ object maps each file's location to a file.
		 * 
		 *     {
		 *       "jquery/controller/controller.js" : file1,
		 *       "jquery/class/class.js" : file2
		 *     }
		 * 
		 * @param {steal} steel a steal instance
		 * @param {Object} files the files mapping that gets filled out
		 * @param {String} appName the appName
		 * @return {file} the root dependency file for this application
		 */
		addDependencies: function( steel, files, appName ) {
			// check if a fn ...
			
			var rootSrc = steel.options.rootSrc,
				buildType = steel.options.buildType,
				
				file = maker(files, rootSrc, function(){
				
					print(" compressing " + rootSrc + " ");
					
					//clean and minifify everything right away ...
					if( steel.options.buildType != 'fn' ) {
						// some might not have source yet
						var source = steel.options.text ||  readFile( rootSrc );
						source = steal.build.builders[buildType].clean(source);
						steel.options.text = steal.build.builders[buildType].minify(source);
					}
					
					// this becomes data
					return {
						// todo, might need to merge options
						// what if we should not 'steal' it?
						stealOpts: steel.options,
						appNames: [],
						dependencyFileNames: [],
						packaged: false
					}
					
				})

			// don't add the same appName more than once
			if(file.appNames.indexOf(appName) == -1){
				file.appNames.push(appName);
			}
			steel.dependencies.forEach(function(dependency){
				if ( dependency.dependencies && 
				     dependency.options.buildType != 'fn' && 
					 !dependency.options.ignore) {
					 
					file.dependencyFileNames.push(dependency.options.rootSrc)
					 
					arguments.callee(dependency, files, appName);
				}
			});
			
			return file;
		},
		
		orderFiles: function( appFiles, files ) {
			var order = 0

			function visit( f ) {
				if ( f.order === undefined ) {
					f.dependencyFileNames.forEach(function(fileName){
						visit( files[fileName] )
					})
					f.order = (order++);
				}
			}
			appFiles.forEach(function(file){
				visit(file)
			});
		},
		/**
		 * @hide
		 * 
		 * Goes through the files, makes a __shared__ array of 
		 * __sharedSets__. Each
		 * sharedSet is a collection of __sharings__.  It then
		 * takes the last __sharedSet__, finds the __sharing__
		 * with the largest totalSize, and returns that
		 * __sharing__.
		 * 
		 * A __sharing__ is a collection of files that are shared between some
		 * set of applications.  A 2-order sharing might look like:
		 * 
		 *     {totalSize: 1231, files: [file1, file2], appNames: ['foo','bar']}
		 * 
		 * A sharedSet is collection of sharings that are all shared the 
		 * same number of times (order).  For example, a sharedSet might have all
		 * 4-order 'sharings', that is files that are shared between 
		 * 4 applications.  A 2 order sharedSet might look like:
		 * 
		 *     {
		 *       'foo,bar' : {totalSize: 1231, files: [], appNames: ['foo','bar']}
		 * 	     'bar,car': : {totalSize: 31231, files: [], appNames: ['bar','car']}
		 *     }
		 * 
		 * The __shared__ array is an collection of sharedSets ordered by the
		 * order-number (the number of times a file is shared by an application).
		 * 
		 * ## How it works
		 * 
		 * getMostShared is designed to be called until all files have been
		 * marked packaged.  Thus, it changes the files by marking files 
		 * as packaged.
		 * 
		 * @param {Object} files - the files object.  
		 * @return {sharing} The sharing object:
		 * 
		 *     {
		 *       // apps that need this
		 *       appNames : ['cookbook','mxui/grid','mxui/data/list'],
		 *       files : [{file1}, {file2}]
		 *     }
		 */
		getMostShared: function( files ) {
			
			// create an array of sharedSets
			// A shared set is 
			// a collection of 
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
				// [
				//    1: {
				//       'foo' : 
				//    },
				//    2 : {
				//       'foo,bar' : {totalSize: 1231, files: [], appNames: ['foo','bar']}
				//       'bar,car': 
				//    }
				//  get an object to represent combinations
				var sharedSet = maker(shared, file.appNames.length, {}),
					
					// a name for the combo
					appsName = file.appNames.sort().join(),
					// a pack is data for a specific appNames combo
					sharing = maker(sharedSet, appsName, function(){
						return {
							totalSize: 0,
							files: [],
							appNames: file.appNames
						}
					});
				
				sharing.files.push(file);
				sharing.totalSize += file.stealOpts.text.length;
			}
			
			if (!shared.length ) {
				return null;
			}
			// get the highest shared number
			var mostShared = shared.pop(),
				mostSize = 0,
				most;
				
			// go through each app combo, get the one that has
			// the bigest size
			for ( var apps in mostShared ) {
				if ( mostShared[apps].totalSize > mostSize ) {
					most = mostShared[apps];
					mostSize = most.totalSize;
				}
			}
			//mark files as packaged
			most.files.forEach(function(f){
				f.packaged = true;
			});
			
			return most;
		},
		/**
		 * Creates packages that can be downloaded.
		 * 
		 * Recursively uses getMostShared to pull out
		 * the largest __sharing__.  It 
		 * makes a package of the sharing and marks
		 * the apps that need that sharing.
		 * 
		 * The apps that need the sharing
		 * 
		 * packages are mostly dummy things.  
		 * 
		 * a production file might steal multiple packages.
		 * 
		 * say package A and package B
		 * 
		 * say package A has jQuery
		 * 
		 * so, the production file has code like:
		 * 
		 * steal('jquery')
		 * 
		 * It needs to know to not load jQuery
		 * 
		 * this is where 'has' comes into place
		 * 
		 * steal({src: 'packageA', has: 'jquery'})
		 * 
		 * This wires up steal to wait until package A is finished for jQuery.
		 * 
		 * So, we need to know all the packages and app needs, and all the things in that package.
		 * 
		 * @param {appFiles} appFiles
		 * @param {files} files
		 */
		makePackages: function(appFiles, files){
			
			print("Making packages")
			
			//add an order number so we can sort them nicely
			apps.orderFiles(appFiles, files);

			// will be set to the biggest group
			var sharing,
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
				 * this is used to mark all of these
				 * things as loading, so steal doesn't try to load them
				 * b/c the package is loading
				 */
				packagesFiles = {};

			// make an array for each appName that will contain the packages
			// it needs to load
			appFiles.forEach(function(file){
				appsPackages[file.stealOpts.rootSrc] = [];
			})

			//while there are files left to be packaged, get the most shared and largest package
			while ((sharing = apps.getMostShared(files))) {
				
				print('\npackaging shared by ' + sharing.apps.join(", "))

				
				var appsName = sharing.apps[0],
				//  the name of the file we are making.  
				//    If there is only one app it's an app's production.js
				//    If there are multiple apps, it's a package
					packageName = sharing.apps.length == 1 ? 
									appsName + "/production.js" : 
									"packages/" + packageCount + ".js"
				
				// if there's multiple apps (it's a package), add this to appsPackages for each app
				if( sharing.apps.length > 1) {
					sharing.apps.forEach(function(appName){
						appsPackages[appName].push(packageName)
					})
				}
				
				// order the files by when they should be included
				var ordered = sharing.files.sort(function( f1, f2 ) {
					return f1.order - f2.order;
				});
				
				// add the files to this package
				packagesFiles[packageName] =[];
				
				// what we will sent to js.makePackage
				var filesForPackaging = []; 
				
				ordered.forEach(function(file){
					packagesFiles[packageName].push(file.steal.rootSrc);
					filesForPackaging.push(file.steal)
					print("  " + file.order + ":" + file.steal.rootSrc);
				});
				
				// create dependencies object
				var dependencies = {};
				if( sharing.apps.length == 1) {
					appsPackages[appsName].forEach(function(packageName){
						dependencies[packageName] = packagesFiles[packageName].slice(0)
					})
				}
				
				//the source of the package
				//
				var source = steal.build.js.makePackage(filesForPackaging, dependencies)

				

				//save the file
				print("saving " + packageName);
				steal.File(packageName).save( source );

				
				packageCount++;
			}

		}
	})
	
		
	var maker = function(root, prop, raw, cb){
		if(!root[prop]){
			root[prop] = ( typeof raw === 'object' ?
				steal.extend({},raw) :
				raw() );
		}
		cb && cb( root[prop] )
		return root[prop];
	}
})