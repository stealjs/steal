/*
  SystemJS AMD Format
  Provides the AMD module format definition at System.format.amd
  as well as a RequireJS-style require on System.require
*/
function amd(loader) {
  // by default we only enforce AMD noConflict mode in Node
  var isNode = typeof module != 'undefined' && module.exports;

  loader._extensions.push(amd);

  // AMD Module Format Detection RegEx
  // define([.., .., ..], ...)
  // define(varName); || define(function(require, exports) {}); || define({})
  var amdRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?\s*(\[(\s*(("[^"]+"|'[^']+')\s*,|\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*(\s*("[^"]+"|'[^']+')\s*,?)?(\s*(\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*\s*\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;

  var strictCommentRegEx = /\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm
  var beforeRegEx = /(function|var|let|const|return|export|\"|\'|\(|\=)$/i

  var fnBracketRegEx = /\(([^\)]*)\)/;
  var wsRegEx = /^\s+|\s+$/g;

  var requireRegExs = {};
  var chunkEndCounterpart = {
    "/*": /[\s\S]*?\*\//g,
    "//": /[^\r\n]+(?:\r?\n|$)/g,
    '"': /(?:\\[\s\S]|[^\\])*?"/g,
    "'": /(?:\\[\s\S]|[^\\])*?'/g,
    "`": /(?:\\[\s\S]|[^\\])*?`/g,
    "require": /\s*\(\s*(['"`])((?:\\[\s\S]|(?!\1)[^\\])*?)\1\s*\)/g,
    "/regexp/": /\/(?:(?:\\.|[^\/\r\n])+?)\//g
  };

  /*
    Find CJS Deps in valid javascript
    Loops through the source once by progressivly identifying "chunks"
    Chunks are:
    multi-line comments, single line comments, strings using ", ', or `, regular expressions, and the special case of the requireAlias
    When the start of a chunk is potentially identified, we grab the corresponding 'endRx' and execute it on source at the same spot
    If the endRx matches correctly at that location, we advance the chunk start regex's lastIndex to the end of the chunk and continue.
    If it's the requireAlias that successfully matched, then we pull the string ('./path') out of the match and push as a dep before continuing.
  */
  function getCJSDeps (source, requireIndex) {
    var deps = [];
    // determine the require alias
    var params = source.match(fnBracketRegEx);
    var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');

    // Create a cache of the chunk start regex based on the require alias
    var chunkStartRegex = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp("/\\*|//|\"|'|`|(?:^|\\breturn\\b|[([=,;:?><&|^*%~+-])\\s*(?=\/)|\\b" + requireAlias + "(?=\\s*\\()", "g"));
    // Look for potential chunks from the start of source
    chunkStartRegex.lastIndex = 0;
    // Make sure chunkEndCounterpart object has a key of requireAlias that points to the common 'require' ending rx for later
    chunkEndCounterpart[requireAlias] = chunkEndCounterpart.require;

    var startExec, chunkStartKey, endRx, endExec;
    // Execute our starting regex search on source to identify where chunks start
    while (startExec = chunkStartRegex.exec(source)) {
      // assume the match is a key for our chunkEndCounterpart object
      // This will be strings like "//", "'", "require", etc
      chunkStartKey = startExec[0];
      // and grab that chunk's ending regular expression
      endRx = chunkEndCounterpart[chunkStartKey];

      if (!endRx) {
        // If what we grabbed doesn't have an entry on chunkEndCounterpart, that means we're identified where a regex might be.
        // So just change our key to a common one used when identifying regular expressions in the js source
        chunkStartKey = "/regexp/";
        // and grab the regex-type chunk's ending regular expression
        endRx = chunkEndCounterpart[chunkStartKey];
      }
      // Set the endRx to start looking exactly where our chunkStartRegex loop ended the match
      endRx.lastIndex = chunkStartRegex.lastIndex;
      // and execute it on source
      endExec = endRx.exec(source);

      // if the endRx matched and it matched starting exactly where we told it to start
      if (endExec && endExec.index === chunkStartRegex.lastIndex) {
        // Then we have identified a chunk correctly and we advance our loop of chunkStartRegex to continue after this chunk
        chunkStartRegex.lastIndex = endRx.lastIndex;
        // if we are specifically identifying the requireAlias-type chunk at this point,
        if (endRx === chunkEndCounterpart.require) {
          // then the second capture group of the endRx is what's inside the string, inside the ()'s, after requireAlias,
          // which is the path of a dep that we want to return.
		  if(endExec[2]) {
			  deps.push(endExec[2]);
		  }

        }
      }
    }
    return deps;
  }

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.amdRequire
  */
  function require(names, callback, errback, referer) {
    // 'this' is bound to the loader
    var loader = this;

    // in amd, first arg can be a config object... we just ignore
    if (typeof names == 'object' && !(names instanceof Array))
      return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));

    // amd require
    if (names instanceof Array)
      Promise.all(names.map(function(name) {
        return loader['import'](name, referer);
      })).then(function(modules) {
        if(callback) {
          callback.apply(null, modules);
        }
      }, errback);

    // commonjs require
    else if (typeof names == 'string') {
      var module = loader.get(names);
      return module.__useDefault ? module['default'] : module;
    }

    else
      throw new TypeError('Invalid require');
  };
  loader.amdRequire = function() {
    return require.apply(this, arguments);
  };

  function makeRequire(parentName, staticRequire, loader) {
    return function(names, callback, errback) {
      if (typeof names == 'string')
        return staticRequire(names);
      return require.call(loader, names, callback, errback, { name: parentName });
    }
  }

  // run once per loader
  function generateDefine(loader) {
    // script injection mode calls this function synchronously on load
    var onScriptLoad = loader.onScriptLoad;
    loader.onScriptLoad = function(load) {
      onScriptLoad(load);
      if (anonDefine || defineBundle) {
        load.metadata.format = 'defined';
        load.metadata.registered = true;
      }

      if (anonDefine) {
        load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(anonDefine.deps) : anonDefine.deps;
        load.metadata.execute = anonDefine.execute;
      }
    }

    function define(modName, modDeps, modFactory) {
      var name = modName;
      var deps = modDeps;
      var factory = modFactory;
      if (typeof name != 'string') {
        factory = deps;
        deps = name;
        name = null;
      }
      if (!(deps instanceof Array)) {
        factory = deps;
        deps = ['require', 'exports', 'module'];
      }

      if (typeof factory != 'function')
        factory = (function(factory) {
          return function() { return factory; }
        })(factory);

      // in IE8, a trailing comma becomes a trailing undefined entry
      if (deps[deps.length - 1] === undefined)
        deps.pop();

      // remove system dependencies
      var requireIndex, exportsIndex, moduleIndex;

      if ((requireIndex = indexOf.call(deps, 'require')) != -1) {

        deps.splice(requireIndex, 1);

        var factoryText = factory.toString();

        deps = deps.concat(getCJSDeps(factoryText, requireIndex));
      }


      if ((exportsIndex = indexOf.call(deps, 'exports')) != -1)
        deps.splice(exportsIndex, 1);

      if ((moduleIndex = indexOf.call(deps, 'module')) != -1)
        deps.splice(moduleIndex, 1);

      var define = {
        deps: deps,
        execute: function(require, exports, module) {

          var depValues = [];
          for (var i = 0; i < deps.length; i++)
            depValues.push(require(deps[i]));

          module.uri = loader.baseURL + module.id;

          module.config = function() {};

          // add back in system dependencies
          if (moduleIndex != -1)
            depValues.splice(moduleIndex, 0, module);

          if (exportsIndex != -1)
            depValues.splice(exportsIndex, 0, exports);

          if (requireIndex != -1)
            depValues.splice(requireIndex, 0, makeRequire(module.id, require, loader));

          var output = factory.apply(global, depValues);

          if (typeof output == 'undefined' && module)
            output = module.exports;

          if (typeof output != 'undefined')
            return output;
        }
      };

      // anonymous define
      if (!name) {
        // already defined anonymously -> throw
        if (anonDefine)
          throw new TypeError('Multiple defines for anonymous module');
        anonDefine = define;
      }
      // named define
      else {
		var parsedModuleName =
		  currentLoad && currentLoad.metadata && currentLoad.metadata.parsedModuleName;

		// register the full npm name otherwise named modules won't load
		// when the npm extension is used
		if (
		  parsedModuleName &&
		  parsedModuleName.version &&              // verify it is an npm name
		  (parsedModuleName.modulePath === name || // local module
			parsedModuleName.packageName === name) // from a dependency
		) {
		  loader.register(
			parsedModuleName.moduleName,
			define.deps,
			false,
			define.execute
		  );
		}

        // if it has no dependencies and we don't have any other
        // defines, then let this be an anonymous define
        if (deps.length == 0 && !anonDefine && !defineBundle)
          anonDefine = define;

        // otherwise its a bundle only
        else
          anonDefine = null;

        // the above is just to support single modules of the form:
        // define('jquery')
        // still loading anonymously
        // because it is done widely enough to be useful

        // note this is now a bundle
        defineBundle = true;

        // define the module through the register registry
        loader.register(name, define.deps, false, define.execute);
      }
    };
    define.amd = {};
    loader.amdDefine = define;
  }

  var anonDefine;
  // set to true if the current module turns out to be a named define bundle
  var defineBundle;

  // set on the "instantiate" hook (by "createDefine") so it's available in
  // the scope of the "define" function, it's set back to "undefined" after eval
  var currentLoad;

  var oldModule, oldExports, oldDefine;

  // adds define as a global (potentially just temporarily)
  function createDefine(loader, load) {
    if (!loader.amdDefine)
      generateDefine(loader);

    anonDefine = null;
    defineBundle = null;
	currentLoad = load;

    // ensure no NodeJS environment detection
    var global = loader.global;

    oldModule = global.module;
    oldExports = global.exports;
    oldDefine = global.define;

    global.module = undefined;
    global.exports = undefined;

    if (global.define && global.define === loader.amdDefine)
      return;

    global.define = loader.amdDefine;
  }

  function removeDefine(loader) {
    var global = loader.global;
    global.define = oldDefine;
    global.module = oldModule;
    global.exports = oldExports;
	currentLoad = undefined;
  }

  generateDefine(loader);

  if (loader.scriptLoader) {
    var loaderFetch = loader.fetch;
    loader.fetch = function(load) {
      createDefine(this, load);
      return loaderFetch.call(this, load);
    }
  }

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this,
      sourceWithoutComments = load.source.replace(strictCommentRegEx, '$1'),
      match = sourceWithoutComments.match(amdRegEx);

    if (load.metadata.format == 'amd' || !load.metadata.format && match) {

      // make sure that this is really a AMD module
      // get the content from beginning till the matched define block
      var sourceBeforeDefine = sourceWithoutComments.substring(0, sourceWithoutComments.indexOf(match[0])),
        trimmed = sourceBeforeDefine.replace(wsRegEx, "")

      // check if that there is no commen javscript keywork before
      if (!beforeRegEx.test(trimmed)) {
        load.metadata.format = 'amd';

        if (loader.execute !== false) {
          createDefine(loader, load);

          loader.__exec(load);

          removeDefine(loader);

          if (!anonDefine && !defineBundle && !isNode)
            throw new TypeError('AMD module ' + load.name + ' did not define');
        }

        if (anonDefine) {
          load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(anonDefine.deps) : anonDefine.deps;
          load.metadata.execute = anonDefine.execute;
        }
      }
    }

    return loaderInstantiate.call(loader, load);
  }
}
