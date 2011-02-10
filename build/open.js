steal(function(s){
	var touched = {},
		breadth = function(stl, CB){
			//load each dependency unti
			var i =0,
				depends = stl.dependencies.slice(0); 
			  
			while(i < depends.length){
				if(!depends[i].func){
				i++;
			}else{
				var steals = depends.splice(0,i);
				loadset(steals, CB);
				loadset(depends.shift().dependencies, CB)
				i=0;
			}
			}
			if(depends.length){
				loadset(depends, CB);
			}
		  
		},
		loadset = function(steals, CB){
			for(var i =0; i < steals.length; i++){
				if(!touched[steals[i].path]){
					CB( steals[i] );
				}
				
			}
			for(var i =0; i < steals.length; i++){
				if (!touched[steals[i].path]) {
					touched[steals[i].path] = true;
					breadth(steals[i], CB)
				}
			}
		},
		window = (function() {
			return this;
		}).call(null, 0),
		loadScriptText = steal.build.loadScriptText;
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
	 * @return {Object} an object with properties that makes extracting 
	 * the content for a certain tag slightly easier.
	 * 
	 */ 
	steal.build.open = function( url, stealData, cb ) {
		var scripts = [],

			// save and remove the old steal
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
		Envjs(url, {
			scriptTypes: {
				"text/javascript": true,
				"text/envjs": true,
				"": true
			},
			fireLoad: false,
			logLevel: 2,
			afterScriptLoad: {
				".*": function( script ) {
					scripts.push(script);
				}
			},
			onLoadUnknownTypeScript: function( script ) {
				scripts.push(script);
			},
			afterInlineScriptLoad: function( script ) {
				scripts.push(script);
			},
			dontPrintUserAgent: true,
			killTimersAfterLoad: true
		});

		// set back steal
		newSteal = window.steal;
		window.steal = oldSteal;
		window.steal._steal = newSteal;


		// check if newSteal added any build types (used to convert less to css for example).
		if(newSteal && newSteal.build && newSteal.build.types){
			for ( var buildType in newSteal.build.types ) {
				oldSteal.build.types[buildType] = newSteal.build.types[buildType];
			}
		}
		
		newSteal.done(function(init){
			cb({
				/**
				 * @hide
				 * Goes through each steal and gives its content.
				 * How will this work with packages?
				 * @param {Object} [type] the tag to get
				 * @param {Object} func a function to call back with the element and its content
				 */
				each: function( filter, func ) {
					if ( typeof filter == 'function' ) {
						func = filter;
						filter = 'script';
					};
					breadth(init, function(stealer){
						func(stealer, steal.build.types[stealer.type] && steal.build.types[stealer.type](stealer, loadScriptText))
					});
				},
				// the 
				steal: newSteal,
				url: url
			})
		});
		Envjs.wait();
	};
})
