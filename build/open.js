steal(function(s){
	
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
			if(includeFns){
				if(!depends.length){
					touch([stl], CB)
				}
			}
			while(i < depends.length){
				if(depends[i].waits){
					// once we found something like this ...
					if(includeFns){
						var steals = depends.splice(0,i+1),
							curStl = steals[steals.length-1];
					} else {
						var steals = depends.splice(0,i),
							curStl = depends.shift();
					}
					
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
	 *   temporarily deleting the rhino steal
	 *   opening the page with Envjs
	 *   setting back rhino steal, saving envjs's steal as steal._steal;
	 * @param {String} url the html page to open
	 * @param {String} url the html page to open
	 * @return {Object} an object with properties that makes extracting 
	 * the content for a certain tag slightly easier.
	 * 
	 */ 
	steal.build.open = function( url, stealData, cb, depth, includeFns ) {
		
		
		var // save and remove the old steal
			oldSteal = window.steal || steal,
			newSteal;
			
		
		delete window.steal;
		if ( typeof stealData == 'object') {
			window.steal = stealData;
		}else{
			cb = stealData;
		}
		// get envjs
		load('steal/rhino/env.js'); //reload every time
		// open the url
		
		// what gets called by steal.done
		// - init the 'master' steal
		var doneCb = function(init){
			
			// clear timers
			Envjs.clear();
			
			// callback with the following
			cb({
				/**
				 * @hide
				 * Goes through each steal and gives its content.
				 * How will this work with packages?
				 * @param {Object} [type] the tag to get
				 * @param {Object} func a function to call back with the element and its content
				 */
				each: function( filter, func ) {
					// reset touched
					touched = {};
					if ( !func ) {
						func = filter;
						filter = function(){return true;};
					};
					if(typeof filter == 'string'){
						var resource = filter;
						filter = function(stl){
							return stl.options.buildType === resource;
						}
					}
					
					iterate(init, function(stealer){
						if(filter(stealer)){
							func(stealer.options, stealer.options.text || loadScriptText(stealer.options), stealer )
						}
					}, depth, includeFns );
				},
				// the 
				steal: newSteal,
				url: url,
				firstSteal : init
			})
		};
		
		Envjs(url, {
			scriptTypes: {
				"text/javascript": true,
				"text/envjs": true,
				"": true
			},
			fireLoad: true,
			logLevel: 2,
			afterScriptLoad: {
				// prevent $(document).ready from being called even though load is fired
				"jquery.js": function( script ) {
					window.jQuery && jQuery.readyWait++;
				},
				"steal.js": function(script){
					// a flag to tell steal we're in "build" mode
					// this is used to completely ignore files with the "ignore" flag set
					window.steal.isBuilding = true;
					// if there's timers (like in less) we'll never reach next line 
					// unless we bind to done here and kill timers
					window.steal.one('done', doneCb);
				}
			},
			dontPrintUserAgent: true
		});
		
		// set back steal
		newSteal = window.steal;
		window.steal = oldSteal;
		window.steal._steal = newSteal;

		Envjs.wait();
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
		var src = options.src,
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
