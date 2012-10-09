// =============================== STARTUP ===============================
var rootSteal = false;

// essentially ... we need to know when we are on our first steal
// then we need to know when the collection of those steals ends ...
// and, it helps if we use a 'collection' steal because of it's natural
// use for going through the pending queue
//
h.extend(steal, {
	// modifies src
/*makeOptions : after(steal.makeOptions,function(raw){
		raw.src = URI.root().join(raw.rootSrc = URI( raw.rootSrc ).insertMapping());
	}),*/

	//root mappings to other locations
	mappings: {},

	/**
	 * Maps a 'rooted' folder to another location.
	 * @param {String|Object} from the location you want to map from.  For example:
	 *   'foo/bar'
	 * @param {String} [to] where you want to map this folder too.  Ex: 'http://foo.cdn/bar'
	 * @return {steal}
	 */
	map: function( from, to ) {
		if ( h.isString(from) ) {
			steal.mappings[from] = {
				test: new RegExp("^(\/?" + from + ")([/.]|$)"),
				path: to
			};
			h.each(resources, function( id, resource ) {
				if ( resource.options.type != "fn" ) {
					// TODO terrible
					var buildType = resource.options.buildType;
					resource.setOptions(resource.orig);
					resource.options.buildType = buildType;
				}
			})
		} else { // its an object
			h.each(from, steal.map);
		}
		return this;
	},
	// called after steals are added to the pending queue
	after: function() {
		// if we don't have a current 'top' steal
		// we create one and set it up
		// to start loading its dependencies (the current pending steals)
		if (!rootSteal ) {
			rootSteal = new Resource();
			// keep a reference in case it disappears
			var cur = rootSteal,
				// runs when a steal is starting
				go = function() {
					// indicates that a collection of steals has started
					steal.trigger("start", cur);
					cur.completed.then(function() {

						rootSteal = null;
						steal.trigger("end", cur);


					});

					cur.executed();
				};
			// If we are in the browser, wait a
			// brief timeout before executing the rootResource.
			// This allows embeded script tags with steal to be part of 
			// the initial set
			if ( h.win.setTimeout ) {
				// we want to insert a "wait" after the current pending
				steal.pushPending();
				setTimeout(function() {
					steal.popPending();
					go();
				}, 0)
			} else {
				// if we are in rhino, start loading dependencies right away
				go()
			}
		}
	},
	_before: h.before,
	_after: h.after
});

(function(){
	var myPending;
	steal.pushPending = function(){
		myPending = pending.slice(0);
		pending = [];
		h.each(myPending, function(i, arg){
			Resource.make(arg);
		})
	}
	steal.popPending = function(){
		pending = pending.length ? myPending.concat(null,pending) : myPending;
	}
})();

// =============================== jQuery ===============================
(function() {
	var jQueryIncremented = false,
		jQ, ready = false;

	// check if jQuery loaded after every script load ...
	Resource.prototype.executed = h.before(Resource.prototype.executed, function() {

		var $ = h.win.jQuery;
		if ( $ && "readyWait" in $ ) {

			//Increment jQuery readyWait if ncecessary.
			if (!jQueryIncremented ) {
				jQ = $;
				$.readyWait += 1;
				jQueryIncremented = true;
			}
		}
	});

	// once the current batch is done, fire ready if it hasn't already been done
	steal.bind("end", function() {
		if ( jQueryIncremented && !ready ) {
			jQ.ready(true);
			ready = true;
		}
	})


})();






// =========== DEBUG =========


/*var name = function(stel){
	if(stel.options && stel.options.type == "fn"){
		return stel.orig.name? stel.orig.name : stel.options.id+":fn";//(""+stel.orig).substr(0,10)
	}
	return stel.options ? stel.options.id + "": "CONTAINER"
}


//Resource.prototype.load = before( Resource.prototype.load, function(){
//	console.log("      load", name(this), this.loading, steal._id, this.id)
//})

Resource.prototype.executed = before(Resource.prototype.executed, function(){
	var namer= name(this)
	console.log("      executed", namer, steal._id, this.id)
})

Resource.prototype.complete = before(Resource.prototype.complete, function(){
	console.log("      complete", name(this), steal._id, this.id)
})*/



// ============= WINDOW LOAD ========
var addEvent = function( elem, type, fn ) {
	if ( elem.addEventListener ) {
		elem.addEventListener(type, fn, false);
	} else if ( elem.attachEvent ) {
		elem.attachEvent("on" + type, fn);
	} else {
		fn();
	}
},
	loaded = {
		load: Deferred(),
		end: Deferred()
	},
	firstEnd = false;

addEvent(h.win, "load", function() {
	loaded.load.resolve();
});

steal.one("end", function( collection ) {
	loaded.end.resolve(collection);
	firstEnd = collection;
	steal.trigger("done", firstEnd)
})
steal.firstComplete = loaded.end;

Deferred.when(loaded.load, loaded.end).then(function() {
	steal.trigger("ready")
	steal.isReady = true;
});

steal.events.done = {
	add: function( cb ) {
		if ( firstEnd ) {
			cb(firstEnd);
			return false;
		} else {
			return cb;
		}
	}
};

h.startup = h.after(h.startup, function() {
	// get options from 
	var options = {};

	// A: GET OPTIONS
	// 1. get script options
	h.extend(options, steal.getScriptOptions());

	// 2. options from a steal object that existed before this steal
	h.extend(options, h.opts);

	// 3. if url looks like steal[xyz]=bar, add those to the options
	// does this ened to be supported anywhere?
	var search = h.win.location && decodeURIComponent(h.win.location.search);
	search && search.replace(/steal\[([^\]]+)\]=([^&]+)/g, function( whoe, prop, val ) {
		options[prop] = ~val.indexOf(",") ? val.split(",") : val;
	});

	// B: DO THINGS WITH OPTIONS
	// CALCULATE CURRENT LOCATION OF THINGS ...
	steal.config(options);
	

	// mark things that have already been loaded
	h.each(options.executed || [], function( i, stel ) {
		steal.executed(stel)
	})
	// immediate steals we do
	var steals = [];

	// add start files first
	if ( options.startFiles ) {
		/// this can be a string or an array
		steals.push.apply(steals, h.isString(options.startFiles) ? [options.startFiles] : options.startFiles)
		options.startFiles = steals.slice(0)
	}

	// either instrument is in this page (if we're the window opened from
	// steal.browser), or its opener has it
	// try-catching this so we dont have to build up to the iframe
	// instrumentation check
	try {
		// win.top.steal.instrument is for qunit
		// win.top.opener.steal.instrument is for funcunit
		if(!options.browser && ((h.win.top && h.win.top.steal.instrument) || 
								(h.win.top && h.win.top.opener && h.win.top.opener.steal && h.win.top.opener.steal.instrument))) {

			// force startFiles to load before instrument
			steals.push(h.noop, {
				id: "steal/instrument",
				waits: true
			});
		}
	} catch (e) {
		// This would throw permission denied if
		// the child window was from a different domain
	}

	// we only load things with force = true
	if ( stealConfig.env == "production" && stealConfig.loadProduction && stealConfig.production ) {
		steal({
			id: stealConfig.production,
			force: true
		});
	} else {
		steals.unshift("stealconfig.js")

		if ( options.loadDev !== false ) {
			steals.unshift({
				id: "steal/dev/dev.js",
				ignore: true
			});
		}

		if ( options.startFile ) {
			steals.push(null,options.startFile)
		}
	}
	if ( steals.length ) {
		steal.apply(h.win, steals);
	}
});