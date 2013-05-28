/**
 * @property {{}} steal.config.shim
 * @parent steal.config
 * 
 * @signature `steal.config("shim",options)`
 *
 * Allows configuring a
 * specific module's behavior. It accepts an object map of 
 * `moduleId` property names to options. For example, the
 * following ensures that the "jquery" module is loaded before
 * "jquery.ui.tabs.js":
 * 
 *     steal.config("shim",{
 *       "jquery.ui.tabs.js" : {
 *         deps: ["jquery"]
 *       }
 *     });
 * 
 * The following options are supported:
 * 
 * @param {{}} options
 * @option {{Array}} deps the dependencies that must load before this module
 * @option {String} exports define the export value of the module
 * @option {Boolean} ignore ignore this module completely in production builds
 * @option {Boolean} minify minify this script in production
 * @option {Boolean} packaged if set to false, don't package this file, but load it in production
 * @option {String} type the type this module represents
 *
 * @body
 * 
 * ### deps
 * 
 * `deps` is an array of module ids that must load 
 * and run before this module. For example, if `moocalendar` 
 * depends on `mootools` and 'can/view/ejs`, but does not use
 * steal, write:
 * 
 *     steal.config({
 *       shim: {
 *         moocalendar: {
 *           deps: ["mootools","can/view/ejs"]  
 *         }
 *       }       
 *     });
 * 
 * If a shim moduleId's value is an array, or string, it is assumed
 * to be a dependency. This means the following will work the 
 * same as above:
 * 
 *     steal.config({
 *       shim: {
 *         moocalendar: ["mootools","can/view/ejs"]  
 *       }       
 *     });
 * 
 * This type of thing works too:
 * 
 *     steal.config("shim",{
 *       "jquery.ui.tabs.js": "jquery"
 *       }
 *     });
 * 
 * ### exports
 * 
 * The `exports` option allows a module that is not using steal to export a value
 * that can be an argument in a steal callback function. `exports` can
 * be specified as a String or a function.  If `exports` is a string,
 * that string is the name of a global variable to use after the 
 * module's code has been run. For example, the following might allow you 
 * to reference jQuery as __jQ__ in `steal('jquery',function(jQ){})`:
 * 
 *     steal.config({
 *        shim : {
 *          jquery: {
 *            exports: "jQuery"
 *          }
 *        }
 *      })
 * 
 * `"jQuery"` is the name of the global variable to export.
 * 
 * If `exports` is a function, it is run after the module's code has run
 * and passed the modules `deps` as arguments.  The function's return
 * value is used as the module's value. For example:
 * 
 *     steal.config({
 *        shim : {
 *          jquery: {
 *            exports: "jQuery"
 *          },
 *          "slider/slider.js": {
 *            deps: ["jquery","jqueryconstruct.js"]
 *            exports: function($, jQueryConstruct){
 *              return jQueryConstruct($.fn.slider)
 *            }  
 *          }
 *        }
 *      })
 * 
 * ### ignore
 * 
 * Setting `ignore: true` ignores this module completely in production 
 * builds. It does not package it and will not load it.
 * 
 *     steal.config({
 *        shim : {
 *          "mydebugtools/mydebugtools.js": {
 *            ignore: true
 *          }
 *        }
 *      })
 * 
 * ### minify 
 * 
 * Setting `minify: false` prevents this module from being minified. Some modules
 * have already been minified or possibly break with minification.
 * 
 *     steal.config({
 *        shim : {
 *          "datejs": {
 *            minify: false
 *          }
 *        }
 *      })
 * 
 * ### packaged 
 * 
 * Setting `packaged: false` prevents the module from being added in
 * a production build, but it will still load.
 * 
 *     steal.config({
 *        shim : {
 *          "jquery": {
 *            packaged: false
 *          }
 *        }
 *      })
 * 
 * ### type 
 * 
 * Specifying the type can override the module's type infered from
 * it's extension.
 * 
 *     steal.config({
 *        shim : {
 *          "foo/bar.js": {
 *           type: "css"
 *          }
 *        }
 *      })
 * 
 */
st.setupShims = function(shims){
	// Go through all shims
	for(var id in shims){
		// Make resource from shim's id. Since steal takes care
		// of always returning same resource for same id 
		// when someone steals resource created in this function
		// they will get same object back
		var val = shims[id];
		
		(function(module, options){
			// we treat init and exports the same right
			// now to be more amdish
			var exports = options.init || options.exports;
			// rename deps to needs
			if(options.deps){
				options.needs = options.deps;
			}
			// copy everything but what we delete to options
			delete options.init;
			delete options.exports;
			delete options.deps;
			h.extend(module.options, options)
			// setup exports
			if(exports){
				module.exports = function(){
					// setup the arguments
					// not sure if these should be from needs
					var args = [];
					h.each(options.needs || [], function(i, id){
						args.push(Module.make(id).value);
					});
					
					if(typeof exports === "function"){
						// if module has exports function, call it
						module.value = exports.apply(null, args);
					} else {
						// otherwise it's a string so we just return
						// object from the window e.g window['jQuery']
						module.value = h.win[exports];
					}
				}
			}
			
		})( Module.make({id: id}),
			typeof val === "string" ?
				{deps: [val]} :
				( val.length ?
					{deps: val} : val ) );
	}
}