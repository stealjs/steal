steal('steal',function(s){
	// Methods for walking through steal and its dependencies
	
	// which steals have been touched in this cycle
	var touched = {},
		
		//recursively goes through dependencies
		// stl - a steal
		// CB - a callback for each steal
		// depth - true if it should be depth first search, defaults to breadth
		// includeFns - true if it should include functions in the iterator
		iterate = function(stl, CB, depth, includeFns){
			// load each dependency until
			var i =0,
				depends = stl.dependencies.slice(0); 

			// this goes through the scripts until it finds one that waits for 
			// everything before it to complete
			// console.log('OPEN', name(stl), stl.id, "depends on", depends.length)
			// if(includeFns){
				// if(!depends.length){
					// touch([stl], CB)
				// }
			// }
			while(i < depends.length){
				if(depends[i].waits){
					// once we found something like this ...
					// if(includeFns){
						// var steals = depends.splice(0,i+1),
							// curStl = steals[steals.length-1];
					// } else {
						var steals = depends.splice(0,i),
							curStl = depends.shift();
					// }
					
					// load all these steals, and their dependencies
					loadset(steals, CB, depth, includeFns);
					
					// load any dependencies 
					loadset(curStl.dependencies, CB, null, includeFns);
					i=0;
				}else{
					i++;
				}
			}
			
			// if there's a remainder, load them
			if(depends.length){
				loadset(depends, CB, depth, includeFns);
			}
		  
		},
		// loads each steal 'in parallel', then 
		// loads their dependencies one after another
		loadset = function(steals, CB, depth, includeFns){
			// doing depth first
			if(depth){
				// do dependencies first
				eachSteal(steals, CB, depth, includeFns)
				
				// then mark
				touch(steals, CB);
			} else {
				touch(steals, CB);
				eachSteal(steals, CB, depth, includeFns)
			}
		},
		touch = function(steals, CB){
			for(var i =0; i < steals.length; i++){
				var uniqueId = steals[i].id;
				// print("  Touching "+uniqueId, name(steals[i]))
				if(!touched[uniqueId]){
					CB( steals[i] );
					touched[uniqueId] = true;
				}
				
			}
		},
		eachSteal = function(steals, CB, depth, includeFns){
			for(var i =0; i < steals.length; i++){
				// print("  eachsteal ",name(steals[i]))
				iterate(steals[i], CB, depth, includeFns)
			}
		},
		name = function(s){
			return s.options.src;
		},
		window = (function() {
			return this;
		}).call(null, 0);
	/**
	 * @function open
	 * 
	 * Opens a page and returns helpers that can be used to extract steals and their 
	 * content
	 * 
	 * Opens a page by:
	 * 
	 *   - temporarily deleting the rhino steal
	 *   - opening the page with Envjs
	 *   - setting back rhino steal, saving envjs's steal as steal._steal;
	 * 
	 * 
	 * 
	 * 
	 * @param {String} url the html page to open
	 * @param {Object} [stealData] - data to configure steal with
	 * @param {Function} cb(opener) - an object with properties that makes extracting 
	 * the content for a certain tag slightly easier.
	 * 
	 *   - each(filter, depth, callback(options, stel)) - goes through steals loaded by this
	 *     application.  You can provide it a:
	 *     
	 *       - filter - a function to filter out some types of steal methods, 
	 *         it supports js and css.
	 *       - depth - if true, goes through with breadth first search, false is 
	 *         breadth. Defaults to breadth (how steal loads scripts)
	 *       - callback - a method that is called with each steal option
	 *       
	 *         opener.each(function(option){
	 *           console.log(option.text)
	 *         })
	 *         
	 *   - steal - the steal loaded by the app
	 *   - url - the html page opened
	 *   - rootSteal - the 'root' steal instance
	 *   - firstSteal - the first steal file
	 * @return {Object} an object with properties that makes extracting 
	 * the content for a certain tag slightly easier.
	 */
	steal.build.open = function( js, stealData, cb, depth, includeFns ) {
		
		
		// save and remove the old steal
		var oldSteal = window.steal || steal,
			// new steal is the steal opened
			newSteal;
		
		delete window.steal;
		
		window.steal = {
			types : {
				"js" : function(options, success){
					var text = options.text || readFile(options.src);
					// check for steal
					if( /steal\(/.test(text) || /steal\.config/.test(text) ){
						if(options.text){
							eval(text)
						}else{
							load(options.src)
						}
					} else{
						
					}
					
					success()
				},
				"css" : function(options, success){
					success();
				},
				"fn": function(options, success){
					success();
				}
			},
			startFile: js
		}
		load("steal/steal.js");
		//load("steal/rhino/file.js");
		newSteal = window.steal;
		

		/*window.steal.one("end", function(rootSteal){
			steal.print("  adding dependencies");
			
			options.appFiles.push(  apps.addDependencies(rootSteal.dependencies[0], options.files, appName )  );
			
			// set back steal
			window.steal = curSteal;
			callback(options, {
				steal : newSteal,
				rootSteal: rootSteal,
				firstSteal: steal.build.open.firstSteal(rootSteal)
			});
		})*/

	
		// what gets called by steal.done
		// rootSteal the 'master' steal
		var doneCb = function(rootSteal){
			window.steal = oldSteal;
			
			// callback with the following
			cb({
				/**
				 * @hide
				 * Goes through each steal and gives its content.
				 * How will this work with packages?
				 * 
				 * @param {Function} [filter] the tag to get
				 * @param {Boolean} [depth] the tag to get
				 * @param {Object} func a function to call back with the element and its content
				 */
				each: function( filter, depth, func ) {
					// reset touched
					touched = {};
					// move params
					if ( !func ) {
						
						if( depth === undefined ) {
							depth = false;
							func = filter;
							filter = function(){return true;};
						} else if( typeof filter == 'boolean'){
							func = depth;
							depth = filter
							filter = function(){return true;};
						} else if(arguments.length == 2 && typeof filter == 'function' && typeof depth == 'boolean'){
							func = filter;
							filter = function(){return true;};
						} else {  // filter given, no depth
							func = depth;
							depth = false;
							
						}
					};
					
					// make this filter by type
					if(typeof filter == 'string'){
						var resource = filter;
						filter = function(stl){
							return stl.options.buildType === resource;
						}
					}
					var items = [];
					// iterate 
					
					iterate(rootSteal, function(stealer){
						
						if( filter(stealer) ) {
							stealer.options.text = stealer.options.text || loadScriptText(stealer.options);
							func(stealer.options, stealer );
							items.push(stealer.options);
						}
					}, depth, includeFns );
				},
				// the 
				steal: newSteal,
				rootSteal : rootSteal,
				firstSteal : s.build.open.firstSteal(rootSteal)
			})
		};
		window.steal.firstComplete.then(doneCb);

		//window.steal.one('done', doneCb)
		// remove the current steal
		
		// steal(js)
	};
	steal.build.open.firstSteal =function( rootSteal ) {
		var stel;
		for(var i =0; i < rootSteal.dependencies.length; i++){
			stel = rootSteal.dependencies[i]
			if(stel.options.buildType != 'fn' && stel.options.id != 'steal/dev/dev.js'){
				return stel;
			}	
		}
	};
	
	var loadScriptText = function( options ) {
		if(options.fn){
			return options.orig.toString();
		}
		if(options._skip){ // if we skip this script, we don't care about its contents
			return "";
		}
		
		if(options.text){
			return options.text;
		}
		
		// src is relative to the page, we need it relative
		// to the filesystem
		var src = options.src+"",
			text = "",
			base = "" + window.location,
			url = src.match(/([^\?#]*)/)[1];


		
		url = Envjs.uri(url, base);
		
		if ( url.match(/^file\:/) ) {
			url = url.replace("file:/", "");
			text = readFile("/" + url);
		}

		if ( url.match(/^http\:/) ) {
			text = readUrl(url);
		}
		return text;
	};
})
