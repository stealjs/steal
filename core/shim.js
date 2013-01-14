/**
 * @add steal.config
 */
// 
/**
 * @attribute steal.config.shim
 * 
 * `steal.config("shim",options)` allows configuring a
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
 * - __exports__ - define the export value of the module
 * - __deps__ - the dependencies that must load before this module
 * - __type__ - the type this module represents
 * - __minify__ - minify this script in production
 * - __ignore__ - ignore this module completely in production builds
 * - __exclude__ - don't package this file, but load it in production
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
 * ### exports
 * 
 * 
 * 
 * 
 * Implements shim support for steal
 *
 * This function sets up shims for steal. It follows RequireJS' syntax:
 *
 *     steal.config({
 *        shim : {
 *          jquery: {
 *            exports: "jQuery"
 *          }
 *        }
 *      })
 * 
 * You can also set function to explicitely return value from the module:
 *
 *     steal.config({
 *        shim : {
 *          jquery: {
 *            exports: function(){
 *              return window.jQuery;
 *            }
 *          }
 *        }
 *      })
 *
 * This enables steal to pass you a value from library that is not wrapped
 * with steal() call.
 *
 *     steal('jquery', function(j){
 *       // j is set to jQuery
 *     })
 */
st.setupShims = function(shims){
	// Go through all shims
	for(var id in shims){
		// Make resource from shim's id. Since steal takes care
		// of always returning same resource for same id 
		// when someone steals resource created in this function
		// they will get same object back
		var resource = Module.make({id: id});
		if(typeof shims[id] === "object"){
			// set up dependencies of the module
			var needs   = shims[id].deps || []
			var exports = shims[id].exports;
			var init    = shims[id].init
		} else {
			needs = shims[id];
		}
		(function(_resource, _needs){
			_resource.options.needs = _needs;
		})(resource, needs);
		// create resource's exports function. We check for existance
		// of this function in `Module.prototype.executed` and if it exitst
		// it is called, which sets `value` of the module 
		resource.exports = (function(_resource, _needs, _exports, _init){
			return function(){
				var args = [];
				h.each(_needs, function(i, id){
					args.push(Module.make(id).value);
				});
				if(_init){
					// if module has exports function, call it
					_resource.value = _init.apply(null, args);
				} else {
					// otherwise it's a string so we just return
					// object from the window e.g window['jQuery']
					_resource.value = h.win[_exports];
				}
			}
		})(resource, needs, exports, init)
	}
}