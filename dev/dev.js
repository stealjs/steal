/**
 * @class steal.dev
 * @parent stealtools
 * Provides helper functions for development that get removed when put in production mode.
 * This is under development.
 */
steal.dev = {
	regexps : {
        colons : /::/,
        words: /([A-Z]+)([A-Z][a-z])/g,
        lowerUpper : /([a-z\d])([A-Z])/g,
        dash : /([a-z\d])([A-Z])/g
    },
    underscore : function(s){
        var regs = this.regexps;
        return s.replace(regs.colons, '/').
                 replace(regs.words,'$1_$2').
                 replace(regs.lowerUpper,'$1_$2').
                 replace(regs.dash,'_').toLowerCase()
    },
	isHappyName : function(name){
		//make sure names are close to the current path
		var path = steal.current.path.replace(/\.[^$]+$/,"").split('/')
		//make sure parts in name match
		var parts = name.split('.')
		for(var i =0; i < parts.length && path.length; i++){
			if(parts[i].toLowerCase() != path[i] && 
				this.underscore(parts[i]) !=  path[i] &&
				this.underscore(parts[i]) !=  path[i].replace(/_controller/,"")){
				this.warn("Are you sure "+name+" belongs in "+steal.current.path)
			}
		}
	},
	/**
	 * 
	 * @param {Object} out
	 */
	warn : function(out){
		if(window.console && console.log){
			console.log("steal.js WARNING: "+out)
		}
	},
	/**
	 * 
	 * @param {Object} out
	 */
	log : function(out){
		if(window.console && console.log){
			console.log("steal.js INFO: "+out)
		}
	}
}

//stuff for jmvc

/**
 * @Constructor jQuery
 * @init blah
 */

//
/**
 * @Constructor jQuery.fn
 * @init blah
 */
//
/**
 * @class jQuery.event.special
 */
// as fasf sa


