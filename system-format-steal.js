(function(){
	var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
	};
	
	var ext = function(uri){
		var fn = filename(uri);
		var dot = fn.lastIndexOf(".");
		if(dot !== -1) {
			return fn.substr(dot+1);
		} else {
			return "";
		}
	};


	var pluginCache = {};
	
	var normalize = function(name, loader){

		// Detech if this name contains a plugin part like: app.less!steal/less
		// and catch the plugin name so that when it is normalized we do not perform
		// Steal's normalization against it.
		var pluginIndex = name.lastIndexOf('!');
		var pluginPart = "";
		if (pluginIndex != -1) {
			// argumentName is the part before the !
			var argumentName = name.substr(0, pluginIndex);
			var pluginName = name.substr(pluginIndex + 1) || argumentName.substr(argumentName.lastIndexOf('.') + 1);
			pluginPart = "!" + pluginName;
			pluginCache[pluginName] = true;

			// Set the name to the argument name so that we can normalize it alone.
			name = argumentName;
		} else if(pluginCache[name]) {
			// This is a plugin so just return the name unnormalized.
			return name;
		}

		var last = filename(name),
			extension = ext(name);
		// if the name ends with /
		if(	name[name.length -1] === "/" ) {
			return name+filename( name.substr(0, name.length-1) ) + pluginPart;
		} else if(	!/^(\w+(?:s)?:\/\/|\.|file|\/)/.test(name) &&
			// and doesn't end with a dot
			 last.indexOf(".") === -1 
			) {
			return name+"/"+last + pluginPart;
		} else {
			if(extension === "js") {
				return name.substr(0, name.lastIndexOf(".")) + pluginPart;
			} else {
				return name + pluginPart;
			}
		}
	};



  

  // AMD Module Format Detection RegEx
  // define([.., .., ..], ...)
  // define(varName); || define(function(require, exports) {}); || define({})
  var stealRegEx = /(?:^\s*|[}{\(\);,\n\?\&]\s*)steal\s*\(\s*((?:"[^"]+"\s*,|'[^']+'\s*,\s*)*)/;

  function prepareDeps(deps, meta) {
    // remove duplicates
    for (var i = 0; i < deps.length; i++)
      if ([].lastIndexOf.call(deps, deps[i]) != i)
        deps.splice(i--, 1);

    return deps;
  };

  
  var addFormat = function(loader){
  	  function makeRequire(parentName, deps, depsNormalized) {
	    return function(names, callback, errback) {
	      if (typeof names == 'string' && indexOf.call(deps, names) != -1)
	        return loader.getModule(depsNormalized[indexOf.call(deps, names)]);
	      return require(names, callback, errback, { name: parentName });
	    };
	  };
	  function prepareExecute(depNames, load) {
	    var meta = load.metadata;
	    var deps = [];
	    for (var i = 0; i < depNames.length; i++) {
	      var module = loader.get(depNames[i]);
	      if (module.__useDefault) {
	        module = module['default'];
	      }
	      else if (!module.__esModule) {
	        // compatibility -> ES6 modules must have a __esModule flag
	        // we clone the module object to handle this
	        var moduleClone = { __esModule: true };
	        for (var p in module)
	          moduleClone[p] = module[p];
	        module = moduleClone;
	      }
	      deps[i] = module;
	    }
	
	    var module, exports;
	
	    return {
	      deps: deps,
	      module: module || exports && { exports: exports }
	    };
	  }
  	
  	
  	loader.formats.unshift('steal');
  	loader.format.steal = {
	    detect: function(load) {
	      return !!load.source.match(stealRegEx);
	    },
	    deps: function(load) {
		  var global = loader.global;
	      var deps = [];
	      var meta = load.metadata;
	      var oldSteal = global.steal;
		
	      global.steal = function(){
	          for( var i = 0; i < arguments.length; i++ ) {
	          if (typeof arguments[i] == 'string') {
	            deps.push( arguments[i] );
	          } else {
	            meta.factory = arguments[i];
	          }
	        }
	      };
	
	      loader.__exec(load);
	      global.steal = oldSteal;
	      // deps not defined for an AMD module that defines a different name
	      deps = deps || [];
	
	      deps = prepareDeps(deps, meta);
	
	      global.define = undefined;
	
	      meta.deps = deps;
	
	      return deps;
	
	    },
	    execute: function(depNames, load ) {
	      if (!load.metadata.factory)
	        return;
	      var execs = prepareExecute(depNames, load);
	      return load.metadata.factory.apply(loader.global, execs.deps) || execs.module && execs.module.exports;
	    },
	    normalize: function(name, refererName, refererAddress, baseNormalize){
	      return baseNormalize(normalize(name, this), refererName, refererAddress);
	    }
	  };
  	return loader;
  };
  
  if(typeof System !== "undefined") {
  	addFormat(System);
  }

  

})();