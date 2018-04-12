};

var $__curScript, __eval;

(function() {

  var doEval;
  var isWorker = typeof window == 'undefined' && typeof self != 'undefined' && typeof importScripts != 'undefined';
  var isBrowser = typeof window != 'undefined' && typeof document != 'undefined';
  var isNode = typeof process === 'object' && {}.toString.call(process) === '[object process]';
  var isNW = !!(isNode && global.nw && global.nw.process);
  var isChromeExtension = isBrowser && !isNW && window.chrome && window.chrome.extension;
  var isWindows = typeof process != 'undefined' && !!process.platform.match(/^win/);
  var scriptEval;

  doEval = function(source, address, context) {
    try {
      new Function(source).call(context);
    }
    catch(e) {
      throw handleError(e, source, address, context);
    }
  };

  if(isWorker) {
    $__global.upgradeSystemLoader();
  } else if ((isBrowser || isNW) && !isChromeExtension) {
    var head;

    var scripts = document.getElementsByTagName('script');
    $__curScript = scripts[scripts.length - 1];

    // globally scoped eval for the browser
    scriptEval = function(source) {
      if (!head)
        head = document.head || document.body || document.documentElement;

      var script = document.createElement('script');
      script.text = source;
      var onerror = window.onerror;
      var e;
      window.onerror = function(_e) {
        e = _e;
      }
      head.appendChild(script);
      head.removeChild(script);
      window.onerror = onerror;
      if (e)
        throw e;
    };

    $__global.upgradeSystemLoader();
  }
  else if(isNode) {
    var es6ModuleLoader = require('./src/loader');
    $__global.System = es6ModuleLoader.System;
    $__global.Loader = es6ModuleLoader.Loader;
    $__global.upgradeSystemLoader();
    module.exports = $__global.System;

    // global scoped eval for node
    var vm = require('vm');
    doEval = function(source) {
      vm.runInThisContext(source);
    }
  }

  var errArgs = new Error(0, '_').fileName == '_';

  function cleanStack(stack, newStack) {
	  for (var i = 0; i < stack.length; i++) {
		if (typeof $__curScript == 'undefined' || stack[i].indexOf($__curScript.src) == -1)
		  newStack.push(stack[i]);
	  }
  }

  function handleError(err, source, address, context) {
    // parse the stack removing loader code lines for simplification
	var newStack = [], stack;
    if (!err.originalErr) {
      stack = (err.stack || err.message || err).toString().split('\n');
	  cleanStack(stack, newStack);
    }

	if(err.originalErr && !newStack.length) {
	  stack = err.originalErr.stack.toString().split('\n');
	  cleanStack(stack, newStack);
	}

	var isSyntaxError = (err instanceof SyntaxError);
	var isSourceOfSyntaxError = address && isSyntaxError &&
	 	!err.originalErr && newStack.length && err.stack.indexOf(address) === -1;

	if(isSourceOfSyntaxError) {
		// Find the first true stack item
		for(var i = 0; i < newStack.length; i++) {
			if(/(    at )|(@http)/.test(newStack[i])) {
				newStack.splice(i, 1, "    at eval (" + address + ":1:1)");
				err.stack = newStack.join("\n\t");
				break;
			}
		}
	}

	var newMsg = err.message;

    // Convert file:/// URLs to paths in Node
    if (!isBrowser)
      newMsg = newMsg.replace(isWindows ? /file:\/\/\//g : /file:\/\//g, '');

	var ErrorType = err.constructor || Error;
    var newErr = errArgs ? new ErrorType(newMsg, err.fileName, err.lineNumber) :
		new ErrorType(newMsg);

    // Node needs stack adjustment for throw to show message
    if (!isBrowser)
      newErr.stack = newStack.join('\n\t');
    // Clearing the stack stops unnecessary loader lines showing
    else if(newStack)
      newErr.stack = newStack.join('\n\t');

    // track the original error
    newErr.originalErr = err.originalErr || err;
	newErr.firstErr = err.firstErr || newErr;

	newErr.onModuleExecution = true;

	if(isSyntaxError) {
		newErr.onlyIncludeCodeFrameIfRootModule = true;
		return handleSyntaxError(newErr, source);
	}

    return newErr;
  }

  function handleSyntaxError(fromError, source) {
	  var logError = (fromError.firstErr && fromError.firstErr.logError) ||
	  	logSyntaxError.bind(null, source);

	  return Object.defineProperty(fromError, "logError", {
		  enumerable: false,
		  value: logError
	  });
  }

  function logSyntaxError(source, c) {
	  setTimeout(function(){
		  new Function(source);
	  });
  }

  __eval = function(inSource, address, context, sourceMap, evalType) {
	var source = inSource;
    source += '\n//# sourceURL=' + address + (sourceMap ? '\n//# sourceMappingURL=' + sourceMap : '');


    var useScriptEval = evalType === 'script'
      && typeof scriptEval === 'function';
    if(useScriptEval) {
      scriptEval(source);
    } else {
      doEval(source, address, context);
    }
  };

})();

})(typeof window != 'undefined' ? window : (typeof WorkerGlobalScope != 'undefined' ? self : global));
