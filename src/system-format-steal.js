
  

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

  
