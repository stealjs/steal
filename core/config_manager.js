/**
 * `new ConfigManager(config)` creates configuration profile for the steal context.
 * It keeps all config parameters in the instance which allows steal to clone it's 
 * context.
 */


/**
 *
 **/
var ConfigManager = function(options){
	this.stealConfig = {};
	this.callbacks = [];
	this.attr(ConfigManager.defaults);
	this.attr(options)
}
h.extend(ConfigManager.prototype, {
	attr: function( config ) {
		if(!config){ // called as a getter, so just return
			return this.stealConfig;
		}
		if(arguments.length === 1 && typeof config === "string"){ // called as a getter, so just return
			return this.stealConfig && this.stealConfig[config];
		}
		this.stealConfig = this.stealConfig || {};
		for(var prop in config){
			var value = config[prop];
			// if it's a special function
			this[prop] ?
				// run it
				this[prop](value) :
				// otherwise set or extend
				(typeof value == "object" && this.stealConfig[prop] ?
					// extend
					h.extend( this.stealConfig[prop], value) :
					// set
					this.stealConfig[prop] = value);
				
		}

		for(var i = 0; i < this.callbacks.length; i++){
			this.callbacks[i](this.stealConfig)
		}
		
		return this;
	},
	on: function(cb){
		this.callbacks.push(cb)
	},
	startFile: function(startFile){
		// make sure startFile and production look right
		this.stealConfig.startFile = "" + URI(startFile).addJS()
		if (!this.stealConfig.production ) {
			this.stealConfig.production = URI(this.stealConfig.startFile).dir() + "/production.js";
		}
		
	},

	/**
	 * Read or define the path relative URI's should be referenced from.
	 * 
	 *     window.location //-> "http://foo.com/site/index.html"
	 *     st.URI.root("http://foo.com/app/files/")
	 *     st.root.toString() //-> "../../app/files/"
	 */
	root: function( relativeURI ) {
		if ( relativeURI !== undefined ) {
			var root = URI(relativeURI);

			// the current folder-location of the page http://foo.com/bar/card
			var cleaned = URI.page,
				// the absolute location or root
				loc = cleaned.join(relativeURI);

			// cur now points to the 'root' location, but from the page
			URI.cur = loc.pathTo(cleaned)
			this.stealConfig.root = root;
			return this;
		}
		this.stealConfig.root =  root || URI("");
	},
	//var stealConfig = configs[configContext];
	cloneContext: function(){
		return new ConfigManager( h.extend( {}, this.stealConfig ) );
	}
})
ConfigManager.defaults = {
	types: {},
	ext: {},
	env: "development",
	loadProduction: true,
	logLevel: 0,
	root: "",
	amd: false
};