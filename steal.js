(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {
  requirejs._eak_seen = registry;

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("promise/all", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */

    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;

    /**
      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The return promise
      is fulfilled with an array that gives all the values in the order they were
      passed in the `promises` array argument.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @for RSVP
      @param {Array} promises
      @param {String} label
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
    */
    function all(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to all.');
      }

      return new Promise(function(resolve, reject) {
        var results = [], remaining = promises.length,
        promise;

        if (remaining === 0) {
          resolve([]);
        }

        function resolver(index) {
          return function(value) {
            resolveAll(index, value);
          };
        }

        function resolveAll(index, value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        }

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && isFunction(promise.then)) {
            promise.then(resolver(i), reject);
          } else {
            resolveAll(i, promise);
          }
        }
      });
    }

    __exports__.all = all;
  });
define("promise/asap", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var browserGlobal = (typeof window !== 'undefined') ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

    // node
    function useNextTick() {
      return function() {
        process.nextTick(flush);
      };
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    function useSetTimeout() {
      return function() {
        local.setTimeout(flush, 1);
      };
    }

    var queue = [];
    function flush() {
      for (var i = 0; i < queue.length; i++) {
        var tuple = queue[i];
        var callback = tuple[0], arg = tuple[1];
        callback(arg);
      }
      queue = [];
    }

    var scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else {
      scheduleFlush = useSetTimeout();
    }

    function asap(callback, arg) {
      var length = queue.push([callback, arg]);
      if (length === 1) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
      }
    }

    __exports__.asap = asap;
  });
define("promise/config", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var config = {
      instrument: false
    };

    function configure(name, value) {
      if (arguments.length === 2) {
        config[name] = value;
      } else {
        return config[name];
      }
    }

    __exports__.config = config;
    __exports__.configure = configure;
  });
define("promise/polyfill", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global self*/
    var RSVPPromise = __dependency1__.Promise;
    var isFunction = __dependency2__.isFunction;

    function polyfill() {
      var local;

      if (typeof global !== 'undefined') {
        local = global;
      } else if (typeof window !== 'undefined' && window.document) {
        local = window;
      } else {
        local = self;
      }

      var es6PromiseSupport = 
        "Promise" in local &&
        // Some of these methods are missing from
        // Firefox/Chrome experimental implementations
        "resolve" in local.Promise &&
        "reject" in local.Promise &&
        "all" in local.Promise &&
        "race" in local.Promise &&
        // Older version of the spec had a resolver object
        // as the arg rather than a function
        (function() {
          var resolve;
          new local.Promise(function(r) { resolve = r; });
          return isFunction(resolve);
        }());

      if (!es6PromiseSupport) {
        local.Promise = RSVPPromise;
      }
    }

    __exports__.polyfill = polyfill;
  });
define("promise/promise", 
  ["./config","./utils","./all","./race","./resolve","./reject","./asap","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var configure = __dependency1__.configure;
    var objectOrFunction = __dependency2__.objectOrFunction;
    var isFunction = __dependency2__.isFunction;
    var now = __dependency2__.now;
    var all = __dependency3__.all;
    var race = __dependency4__.race;
    var staticResolve = __dependency5__.resolve;
    var staticReject = __dependency6__.reject;
    var asap = __dependency7__.asap;

    var counter = 0;

    config.async = asap; // default async is asap;

    function Promise(resolver) {
      if (!isFunction(resolver)) {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
      }

      if (!(this instanceof Promise)) {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
      }

      this._subscribers = [];

      invokeResolver(resolver, this);
    }

    function invokeResolver(resolver, promise) {
      function resolvePromise(value) {
        resolve(promise, value);
      }

      function rejectPromise(reason) {
        reject(promise, reason);
      }

      try {
        resolver(resolvePromise, rejectPromise);
      } catch(e) {
        rejectPromise(e);
      }
    }

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = detail;
        succeeded = true;
      }

      if (handleThenable(promise, value)) {
        return;
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        resolve(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    var PENDING   = void 0;
    var SEALED    = 0;
    var FULFILLED = 1;
    var REJECTED  = 2;

    function subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      subscribers[length] = child;
      subscribers[length + FULFILLED] = onFulfillment;
      subscribers[length + REJECTED]  = onRejection;
    }

    function publish(promise, settled) {
      var child, callback, subscribers = promise._subscribers, detail = promise._detail;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        invokeCallback(settled, child, callback, detail);
      }

      promise._subscribers = null;
    }

    Promise.prototype = {
      constructor: Promise,

      _state: undefined,
      _detail: undefined,
      _subscribers: undefined,

      then: function(onFulfillment, onRejection) {
        var promise = this;

        var thenPromise = new this.constructor(function() {});

        if (this._state) {
          var callbacks = arguments;
          config.async(function invokePromiseCallback() {
            invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
          });
        } else {
          subscribe(this, thenPromise, onFulfillment, onRejection);
        }

        return thenPromise;
      },

      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };

    Promise.all = all;
    Promise.race = race;
    Promise.resolve = staticResolve;
    Promise.reject = staticReject;

    function handleThenable(promise, value) {
      var then = null,
      resolved;

      try {
        if (promise === value) {
          throw new TypeError("A promises callback cannot return that same promise.");
        }

        if (objectOrFunction(value)) {
          then = value.then;

          if (isFunction(then)) {
            then.call(value, function(val) {
              if (resolved) { return true; }
              resolved = true;

              if (value !== val) {
                resolve(promise, val);
              } else {
                fulfill(promise, val);
              }
            }, function(val) {
              if (resolved) { return true; }
              resolved = true;

              reject(promise, val);
            });

            return true;
          }
        }
      } catch (error) {
        if (resolved) { return true; }
        reject(promise, error);
        return true;
      }

      return false;
    }

    function resolve(promise, value) {
      if (promise === value) {
        fulfill(promise, value);
      } else if (!handleThenable(promise, value)) {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = value;

      config.async(publishFulfillment, promise);
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = reason;

      config.async(publishRejection, promise);
    }

    function publishFulfillment(promise) {
      publish(promise, promise._state = FULFILLED);
    }

    function publishRejection(promise) {
      publish(promise, promise._state = REJECTED);
    }

    __exports__.Promise = Promise;
  });
define("promise/race", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */
    var isArray = __dependency1__.isArray;

    /**
      `RSVP.race` allows you to watch a series of promises and act as soon as the
      first promise given to the `promises` argument fulfills or rejects.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.race` is deterministic in that only the state of the first completed
      promise matters. For example, even if other promises given to the `promises`
      array argument are resolved, but the first completed promise has become
      rejected before the other promises became fulfilled, the returned promise
      will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // Code here never runs because there are rejected promises!
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      @method race
      @for RSVP
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise that becomes fulfilled with the value the first
      completed promises is resolved with if the first completed promise was
      fulfilled, or rejected with the reason that the first completed promise
      was rejected with.
    */
    function race(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to race.');
      }
      return new Promise(function(resolve, reject) {
        var results = [], promise;

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && typeof promise.then === 'function') {
            promise.then(resolve, reject);
          } else {
            resolve(promise);
          }
        }
      });
    }

    __exports__.race = race;
  });
define("promise/reject", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.reject` returns a promise that will become rejected with the passed
      `reason`. `RSVP.reject` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become rejected with the given
      `reason`.
    */
    function reject(reason) {
      /*jshint validthis:true */
      var Promise = this;

      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    }

    __exports__.reject = reject;
  });
define("promise/resolve", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function resolve(value) {
      /*jshint validthis:true */
      if (value && typeof value === 'object' && value.constructor === this) {
        return value;
      }

      var Promise = this;

      return new Promise(function(resolve) {
        resolve(value);
      });
    }

    __exports__.resolve = resolve;
  });
define("promise/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function objectOrFunction(x) {
      return isFunction(x) || (typeof x === "object" && x !== null);
    }

    function isFunction(x) {
      return typeof x === "function";
    }

    function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function() { return new Date().getTime(); };


    __exports__.objectOrFunction = objectOrFunction;
    __exports__.isFunction = isFunction;
    __exports__.isArray = isArray;
    __exports__.now = now;
  });
requireModule('promise/polyfill').polyfill();
}());
/*
*********************************************************************************************

  Loader Polyfill

    - Implemented exactly to the 2014-04-27 Specification Draft.
      Loader implemented to the modules draft from
      https://github.com/jorendorff/js-loaders/blob/e60d3651/specs/es6-modules-2013-12-02.pdf
    
    - All functions are commented with their spec numbers, with spec differences commented.

    - All spec bugs are commented in this code with links to the spec bugs.

    - Abstract functions have been combined where possible, and their associated functions
      commented.

    - When the traceur global is detected, declarative modules are transformed by Traceur
      into the `instantiate` System.register output.

    - Realm implementation is entirely omitted. As such, the Loader.realm accessor will 
      throw an error, as well as Loader.eval. Realm arguments are not passed.

    - Loader module table iteration currently not yet implemented

*********************************************************************************************
*/

// Some Helpers

// logs a linkset snapshot for debugging
/* function snapshot(loader) {
  console.log('---Snapshot---');
  for (var i = 0; i < loader.loads.length; i++) {
    var load = loader.loads[i];
    var linkSetLog = '  ' + load.name + ' (' + load.status + '): ';

    for (var j = 0; j < load.linkSets.length; j++) {
      linkSetLog += '{' + logloads(load.linkSets[j].loads) + '} ';
    }
    console.log(linkSetLog);
  }
  console.log('');
}
function logloads(loads) {
  var log = '';
  for (var k = 0; k < loads.length; k++)
    log += loads[k].name + (k != loads.length - 1 ? ' ' : '');
  return log;
} */


/* function checkInvariants() {
  // see https://bugs.ecmascript.org/show_bug.cgi?id=2603#c1

  var loads = System._loader.loads;
  var linkSets = [];
  
  for (var i = 0; i < loads.length; i++) {
    var load = loads[i];
    console.assert(load.status == 'loading' || load.status == 'loaded', 'Each load is loading or loaded');

    for (var j = 0; j < load.linkSets.length; j++) {
      var linkSet = load.linkSets[j];

      for (var k = 0; k < linkSet.loads.length; k++)
        console.assert(loads.indexOf(linkSet.loads[k]) != -1, 'linkSet loads are a subset of loader loads');

      if (linkSets.indexOf(linkSet) == -1)
        linkSets.push(linkSet);
    }
  }

  for (var i = 0; i < loads.length; i++) {
    var load = loads[i];
    for (var j = 0; j < linkSets.length; j++) {
      var linkSet = linkSets[j];

      if (linkSet.loads.indexOf(load) != -1)
        console.assert(load.linkSets.indexOf(linkSet) != -1, 'linkSet contains load -> load contains linkSet');

      if (load.linkSets.indexOf(linkSet) != -1)
        console.assert(linkSet.loads.indexOf(load) != -1, 'load contains linkSet -> linkSet contains load');
    }
  }

  for (var i = 0; i < linkSets.length; i++) {
    var linkSet = linkSets[i];
    for (var j = 0; j < linkSet.loads.length; j++) {
      var load = linkSet.loads[j];

      for (var k = 0; k < load.dependencies.length; k++) {
        var depName = load.dependencies[k].value;
        var depLoad;
        for (var l = 0; l < loads.length; l++) {
          if (loads[l].name != depName)
            continue;
          depLoad = loads[l];
          break;
        }

        // loading records are allowed not to have their dependencies yet
        // if (load.status != 'loading')
        //  console.assert(depLoad, 'depLoad found');

        // console.assert(linkSet.loads.indexOf(depLoad) != -1, 'linkset contains all dependencies');
      }
    }
  }
} */


(function (__global) {
  (function() {
    var Promise = __global.Promise || require('es6-promise').Promise;

    var traceur;

    var defineProperty;
    try {
      if (!!Object.defineProperty({}, 'a', {})) {
        defineProperty = Object.defineProperty;
      }
    } catch (e) {
      defineProperty = function (obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }

    console.assert = console.assert || function() {};

    // Define an IE-friendly shim good-enough for purposes
    var indexOf = Array.prototype.indexOf || function(item) {
      for (var i = 0, thisLen = this.length; i < thisLen; i++) {
        if (this[i] === item) {
          return i;
        }
      }
      return -1;
    };

    // 15.2.3 - Runtime Semantics: Loader State

    // 15.2.3.11
    function createLoaderLoad(object) {
      return {
        // modules is an object for ES5 implementation
        modules: {},
        loads: [],
        loaderObj: object
      };
    }

    // 15.2.3.2 Load Records and LoadRequest Objects

    // 15.2.3.2.1
    function createLoad(name) {
      return {
        status: 'loading',
        name: name,
        linkSets: [],
        dependencies: [],
        metadata: {}
      };
    }

    // 15.2.3.2.2 createLoadRequestObject, absorbed into calling functions
    
    // 15.2.4

    // 15.2.4.1
    function loadModule(loader, name, options) {
      return new Promise(asyncStartLoadPartwayThrough({
        step: options.address ? 'fetch' : 'locate',
        loader: loader,
        moduleName: name,
        moduleMetadata: {},
        moduleSource: options.source,
        moduleAddress: options.address
      }));
    }

    // 15.2.4.2
    function requestLoad(loader, request, refererName, refererAddress) {
      // 15.2.4.2.1 CallNormalize
      return new Promise(function(resolve, reject) {
        resolve(loader.loaderObj.normalize(request, refererName, refererAddress));
      })
      // 15.2.4.2.2 GetOrCreateLoad
      .then(function(name) {
        var load;
        if (loader.modules[name]) {
          return { name: name };
          // See https://bugs.ecmascript.org/show_bug.cgi?id=2795
          /* load = createLoad(name);
          load.status = 'linked';
          load.module = loader.modules[name];
          return load; */
        }

        for (var i = 0, l = loader.loads.length; i < l; i++) {
          load = loader.loads[i];
          if (load.name != name)
            continue;
          console.assert(load.status == 'loading' || load.status == 'loaded', 'loading or loaded');
          return load;
        }

        load = createLoad(name);
        loader.loads.push(load);

        proceedToLocate(loader, load);

        return load;
      });
    }
    
    // 15.2.4.3
    function proceedToLocate(loader, load) {
      proceedToFetch(loader, load,
        Promise.resolve()
        // 15.2.4.3.1 CallLocate
        .then(function() {
          return loader.loaderObj.locate({ name: load.name, metadata: load.metadata });
        })
      );
    }

    // 15.2.4.4
    function proceedToFetch(loader, load, p) {
      proceedToTranslate(loader, load,
        p
        // 15.2.4.4.1 CallFetch
        .then(function(address) {
          // adjusted, see https://bugs.ecmascript.org/show_bug.cgi?id=2602
          if (load.status != 'loading')
            return;
          load.address = address;

          return loader.loaderObj.fetch({ name: load.name, metadata: load.metadata, address: address });
        })
      );
    }

    // 15.2.4.5
    function proceedToTranslate(loader, load, p) {
      p
      // 15.2.4.5.1 CallTranslate
      .then(function(source) {
        if (load.status != 'loading')
          return;
        return loader.loaderObj.translate({ name: load.name, metadata: load.metadata, address: load.address, source: source });
      })

      // 15.2.4.5.2 CallInstantiate
      .then(function(source) {
        if (load.status != 'loading')
          return;
        load.source = source;
        return loader.loaderObj.instantiate({ name: load.name, metadata: load.metadata, address: load.address, source: source });
      })

      // 15.2.4.5.3 InstantiateSucceeded
      .then(function(instantiateResult) {
        if (load.status != 'loading')
          return;

        var depsList;
        if (instantiateResult === undefined) {
          if (!__global.traceur)
            throw new TypeError('Include Traceur for module syntax support');

          traceur = traceur || __global.traceur;
          load.address = load.address || 'anon' + ++anonCnt;

          console.assert(load.source, 'Non-empty source');

          try {
            var parser = new traceur.syntax.Parser(new traceur.syntax.SourceFile(load.address, load.source));
            var body = parser.parseModule();

            load.kind = 'declarative';
            depsList = getImports(body);

            var oldSourceMaps = traceur.options.sourceMaps;
            var oldModules = traceur.options.modules;

            traceur.options.sourceMaps = true;
            traceur.options.modules = 'instantiate';

            var reporter = new traceur.util.ErrorReporter();

            reporter.reportMessageInternal = function(location, kind, format, args) {
              throw new SyntaxError(kind, location.start && location.start.line_, location.start && location.start.column_);
            }

            // traceur expects its version of System
            var curSystem = __global.System;
            __global.System = __global.traceurSystem;

            var tree = (new traceur.codegeneration.module.AttachModuleNameTransformer(load.name)).transformAny(body);
            tree = (new traceur.codegeneration.FromOptionsTransformer(reporter)).transform(tree);

            var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: load.address });
            var options = { sourceMapGenerator: sourceMapGenerator };

            var source = traceur.outputgeneration.TreeWriter.write(tree, options);

            if (__global.btoa)
              source += '\n//# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(options.sourceMap))) + '\n';

            // now run System.register
            var curRegister = System.register;
            
            System.register = function(name, deps, declare) {
              // store the registered declaration as load.declare
              load.declare = typeof name == 'string' ? declare : deps;
            }

            __eval(source, __global, load.name);
          }
          catch(e) {
            if (e.name == 'SyntaxError' || e.name == 'TypeError') 
              e.message = 'Evaluating ' + (load.name || load.address) + '\n\t' + e.message;
            if (curRegister)
              System.register = curRegister;
            if (curSystem)
              __global.System = curSystem;
            if (oldSourceMaps)
              traceur.options.sourceMaps = oldSourceMaps;
            if (oldModules)
              traceur.options.modules = oldModules;
            throw e;
          }
          System.register = curRegister;
          __global.System = curSystem;
          traceur.options.sourceMaps = oldSourceMaps;
          traceur.options.modules = oldModules;
        }
        else if (typeof instantiateResult == 'object') {
          depsList = instantiateResult.deps || [];
          load.execute = instantiateResult.execute;
          load.kind = 'dynamic';
        }
        else
          throw TypeError('Invalid instantiate return value');

        // 15.2.4.6 ProcessLoadDependencies
        load.dependencies = [];
        load.depsList = depsList;

        var loadPromises = [];
        for (var i = 0, l = depsList.length; i < l; i++) (function(request) {
          loadPromises.push(
            requestLoad(loader, request, load.name, load.address)

            // 15.2.4.6.1 AddDependencyLoad (load is parentLoad)
            .then(function(depLoad) {

              console.assert(!load.dependencies.some(function(dep) {
                return dep.key == request;
              }), 'not already a dependency');

              load.dependencies.push({
                key: request,
                value: depLoad.name
              });

              if (!depLoad.status)
                return;

              if (depLoad.status != 'linked') {
                var linkSets = load.linkSets.concat([]);
                for (var i = 0, l = linkSets.length; i < l; i++)
                  addLoadToLinkSet(linkSets[i], depLoad);
              }

              // console.log('AddDependencyLoad ' + depLoad.name + ' for ' + load.name);
              // snapshot(loader);
            })
          );
        })(depsList[i]);

        return Promise.all(loadPromises);
      })

      // 15.2.4.6.2 LoadSucceeded
      .then(function() {
        // console.log('LoadSucceeded ' + load.name);
        // snapshot(loader);

        console.assert(load.status == 'loading', 'is loading');

        load.status = 'loaded';

        var linkSets = load.linkSets.concat([]);
        for (var i = 0, l = linkSets.length; i < l; i++)
          updateLinkSetOnLoad(linkSets[i], load);
      })

      // 15.2.4.5.4 LoadFailed
      ['catch'](function(exc) {
        console.assert(load.status == 'loading', 'is loading on fail');
        load.status = 'failed';
        load.exception = exc;

        var linkSets = load.linkSets.concat([]);
        for (var i = 0, l = linkSets.length; i < l; i++)
          linkSetFailed(linkSets[i], exc);

        console.assert(load.linkSets.length == 0, 'linkSets not removed');
      });
    }

    // 15.2.4.7 PromiseOfStartLoadPartwayThrough absorbed into calling functions

    // 15.2.4.7.1
    function asyncStartLoadPartwayThrough(stepState) {
      return function(resolve, reject) {
        var loader = stepState.loader;
        var name = stepState.moduleName;
        var step = stepState.step;

        if (loader.modules[name]) 
          throw new TypeError('"' + name + '" already exists in the module table');

        // NB this still seems wrong for LoadModule as we may load a dependency
        // of another module directly before it has finished loading.
        for (var i = 0, l = loader.loads.length; i < l; i++)
          if (loader.loads[i].name == name)
            throw new TypeError('"' + name + '" already loading');

        var load = createLoad(name);
        
        load.metadata = stepState.moduleMetadata;

        var linkSet = createLinkSet(loader, load);

        loader.loads.push(load);

        resolve(linkSet.done);

        if (step == 'locate')
          proceedToLocate(loader, load);

        else if (step == 'fetch')
          proceedToFetch(loader, load, Promise.resolve(stepState.moduleAddress));

        else {
          console.assert(step == 'translate', 'translate step');
          load.address = stepState.moduleAddress;
          proceedToTranslate(loader, load, Promise.resolve(stepState.moduleSource));
        }
      }
    }

    // Declarative linking functions run through alternative implementation:
    // 15.2.5.1.1 CreateModuleLinkageRecord not implemented
    // 15.2.5.1.2 LookupExport not implemented
    // 15.2.5.1.3 LookupModuleDependency not implemented

    // 15.2.5.2.1
    function createLinkSet(loader, startingLoad) {
      var linkSet = {
        loader: loader,
        loads: [],
        loadingCount: 0
      };
      linkSet.done = new Promise(function(resolve, reject) {
        linkSet.resolve = resolve;
        linkSet.reject = reject;
      });
      addLoadToLinkSet(linkSet, startingLoad);
      return linkSet;
    }
    // 15.2.5.2.2
    function addLoadToLinkSet(linkSet, load) {
      console.assert(load.status == 'loading' || load.status == 'loaded', 'loading or loaded on link set');

      for (var i = 0, l = linkSet.loads.length; i < l; i++)
        if (linkSet.loads[i] == load)
          return;

      linkSet.loads.push(load);
      load.linkSets.push(linkSet);

      // adjustment, see https://bugs.ecmascript.org/show_bug.cgi?id=2603
      if (load.status != 'loaded') {
        linkSet.loadingCount++;
      }

      var loader = linkSet.loader;

      for (var i = 0, l = load.dependencies.length; i < l; i++) {
        var name = load.dependencies[i].value;

        if (loader.modules[name])
          continue;

        for (var j = 0, d = loader.loads.length; j < d; j++) {
          if (loader.loads[j].name != name)
            continue;
          
          addLoadToLinkSet(linkSet, loader.loads[j]);
          break;
        }
      }
      // console.log('add to linkset ' + load.name);
      // snapshot(linkSet.loader);
    }

    // 15.2.5.2.3
    function updateLinkSetOnLoad(linkSet, load) {
      console.assert(load.status == 'loaded' || load.status == 'linked', 'loaded or linked');

      // console.log('update linkset on load ' + load.name);
      // snapshot(linkSet.loader);

      linkSet.loadingCount--;

      if (linkSet.loadingCount > 0)
        return;

      var startingLoad = linkSet.loads[0];

      // non-executing link variation for loader tracing
      // on the server. Not in spec.
      /***/
      if (linkSet.loader.loaderObj.execute === false) {
        var loads = [].concat(linkSet.loads);
        for (var i = 0; i < loads.length; i++) {
          var load = loads[i];
          load.module = load.kind == 'dynamic' ? {
            module: Module({})
          } : {
            name: load.name,
            module: Module({}),
            evaluated: true
          };
          load.status = 'linked';
          finishLoad(linkSet.loader, load);
        }
        return linkSet.resolve(startingLoad);
      }
      /***/

      try {
        link(linkSet);
      }
      catch(exc) {
        return linkSetFailed(linkSet, exc);
      }

      console.assert(linkSet.loads.length == 0, 'loads cleared');

      linkSet.resolve(startingLoad);
    }

    // 15.2.5.2.4
    function linkSetFailed(linkSet, exc) {
      var loader = linkSet.loader;
      var loads = linkSet.loads.concat([]);
      for (var i = 0, l = loads.length; i < l; i++) {
        var load = loads[i];

        // store all failed load records
        loader.loaderObj.failed = loader.loaderObj.failed || [];
        if (loader.loaderObj.failed.indexOf(load) == -1)
          loader.loaderObj.failed.push(load);

        var linkIndex = indexOf.call(load.linkSets, linkSet);
        console.assert(linkIndex != -1, 'link not present');
        load.linkSets.splice(linkIndex, 1);
        if (load.linkSets.length == 0) {
          var globalLoadsIndex = indexOf.call(linkSet.loader.loads, load);
          if (globalLoadsIndex != -1)
            linkSet.loader.loads.splice(globalLoadsIndex, 1);
        }
      }
      linkSet.reject(exc);
    }

    // 15.2.5.2.5
    function finishLoad(loader, load) {
      // add to global trace if tracing
      if (loader.loaderObj.trace) {
        if (!loader.loaderObj.loads)
          loader.loaderObj.loads = {};
        var depMap = {};
        load.dependencies.forEach(function(dep) {
          depMap[dep.key] = dep.value;
        });
        loader.loaderObj.loads[load.name] = {
          name: load.name,
          deps: load.dependencies.map(function(dep){ return dep.key }),
          depMap: depMap,
          address: load.address,
          metadata: load.metadata,
          source: load.source,
          kind: load.kind
        };
      }
      // if not anonymous, add to the module table
      if (load.name) {
        console.assert(!loader.modules[load.name], 'load not in module table');
        loader.modules[load.name] = load.module;
      }
      var loadIndex = indexOf.call(loader.loads, load);
      if (loadIndex != -1)
        loader.loads.splice(loadIndex, 1);
      for (var i = 0, l = load.linkSets.length; i < l; i++) {
        loadIndex = indexOf.call(load.linkSets[i].loads, load);
        if (loadIndex != -1)
          load.linkSets[i].loads.splice(loadIndex, 1);
      }
      load.linkSets.splice(0, load.linkSets.length);
    }

    // 15.2.5.3 Module Linking Groups

    // 15.2.5.3.2 BuildLinkageGroups alternative implementation
    // Adjustments (also see https://bugs.ecmascript.org/show_bug.cgi?id=2755)
    // 1. groups is an already-interleaved array of group kinds
    // 2. load.groupIndex is set when this function runs
    // 3. load.groupIndex is the interleaved index ie 0 declarative, 1 dynamic, 2 declarative, ... (or starting with dynamic)
    function buildLinkageGroups(load, loads, groups, loader) {
      groups[load.groupIndex] = groups[load.groupIndex] || [];

      // if the load already has a group index and its in its group, its already been done
      // this logic naturally handles cycles
      if (indexOf.call(groups[load.groupIndex], load) != -1)
        return;

      // now add it to the group to indicate its been seen
      groups[load.groupIndex].push(load);

      for (var i = 0; i < loads.length; i++) {
        var loadDep = loads[i];

        // dependencies not found are already linked
        for (var j = 0; j < load.dependencies.length; j++) {
          if (loadDep.name == load.dependencies[j].value) {
            // by definition all loads in linkset are loaded, not linked
            console.assert(loadDep.status == 'loaded', 'Load in linkSet not loaded!');

            // if it is a group transition, the index of the dependency has gone up
            // otherwise it is the same as the parent
            var loadDepGroupIndex = load.groupIndex + (loadDep.kind != load.kind);

            // the group index of an entry is always the maximum
            if (loadDep.groupIndex === undefined || loadDep.groupIndex < loadDepGroupIndex) {
              
              // if already in a group, remove from the old group
              if (loadDep.groupIndex) {
                groups[loadDep.groupIndex].splice(groups[loadDep.groupIndex].indexOf(loadDep), 1);

                // if the old group is empty, then we have a mixed depndency cycle
                if (groups[loadDep.groupIndex].length == 0)
                  throw new TypeError("Mixed dependency cycle detected");
              }

              loadDep.groupIndex = loadDepGroupIndex;
            }

            buildLinkageGroups(loadDep, loads, groups, loader);
          }
        }
      }
    }

    // 15.2.5.4
    function link(linkSet) {

      var loader = linkSet.loader;

      // console.log('linking {' + logloads(loads) + '}');
      // snapshot(loader);

      // 15.2.5.3.1 LinkageGroups alternative implementation

      // build all the groups
      // because the first load represents the top of the tree
      // for a given linkset, we can work down from there
      var groups = [];
      var startingLoad = linkSet.loads[0];
      startingLoad.groupIndex = 0;
      buildLinkageGroups(startingLoad, linkSet.loads, groups, loader);

      // determine the kind of the bottom group
      var curGroupDeclarative = (startingLoad.kind == 'declarative') == groups.length % 2;

      // run through the groups from bottom to top
      for (var i = groups.length - 1; i >= 0; i--) {
        var group = groups[i];
        for (var j = 0; j < group.length; j++) {
          var load = group[j];

          // 15.2.5.5 LinkDeclarativeModules adjusted
          if (curGroupDeclarative) {
            linkDeclarativeModule(load, linkSet.loads, loader);
          }
          // 15.2.5.6 LinkDynamicModules adjusted
          else {
            var module = load.execute();
            if (!module || !module.__esModule)
              throw new TypeError('Execution must define a Module instance');
            load.module = {
              module: module
            };
            load.status = 'linked';
          }
          finishLoad(loader, load);
        }

        // alternative current kind for next loop
        curGroupDeclarative = !curGroupDeclarative;
      }
    }

    // custom declarative linking function
    function linkDeclarativeModule(load, loads, loader) {
      if (load.module)
        return;

      // declare the module with an empty depMap
      var depMap = [];

      var registryEntry = load.declare.call(__global, depMap);

      var moduleDependencies = [];

      // module is just a plain object, until we evaluate it
      var module = registryEntry.exports;

      console.assert(!load.module, 'Load module already declared!');

      load.module = {
        name: load.name,
        dependencies: moduleDependencies,
        execute: registryEntry.execute,
        exports: module,
        evaluated: false
      };

      // now link all the module dependencies
      // amending the depMap as we go
      for (var i = 0; i < load.dependencies.length; i++) {
        var depName = load.dependencies[i].value;
        var depModule;
        // if dependency already a module, use that
        if (loader.modules[depName]) {
          depModule = loader.modules[depName];
        }
        else {
          for (var j = 0; j < loads.length; j++) {
            if (loads[j].name != depName)
              continue;
            
            // only link if already not already started linking (stops at circular / dynamic)
            if (!loads[j].module)
              linkDeclarativeModule(loads[j], loads, loader);
            
            depModule = loads[j].module;
          }
        }

        var depModuleModule = depModule.exports || depModule.module;

        console.assert(depModule, 'Dependency module not found!');

        if (registryEntry.exportStar && indexOf.call(registryEntry.exportStar, load.dependencies[i].key) != -1) {
          // we are exporting * from this dependency
          (function(depModuleModule) {
            for (var p in depModuleModule) (function(p) {
              // if the property is already defined throw?
              defineProperty(module, p, {
                enumerable: true,
                get: function() {
                  return depModuleModule[p];
                },
                set: function(value) {
                  depModuleModule[p] = value;
                }
              });
            })(p);
          })(depModuleModule);
        }

        moduleDependencies.push(depModule);
        depMap[i] = depModuleModule;
      }

      load.status = 'linked';
    }
      


    // 15.2.5.5.1 LinkImports not implemented
    // 15.2.5.7 ResolveExportEntries not implemented
    // 15.2.5.8 ResolveExports not implemented
    // 15.2.5.9 ResolveExport not implemented
    // 15.2.5.10 ResolveImportEntries not implemented

    // 15.2.6.1
    function evaluateLoadedModule(loader, load) {
      console.assert(load.status == 'linked', 'is linked ' + load.name);
      ensureEvaluated(load.module, [], loader);
      return load.module.module;
    }

    /*
     * Module Object non-exotic for ES5:
     *
     * module.module        bound module object
     * module.execute       execution function for module
     * module.dependencies  list of module objects for dependencies
     * 
     */

    // 15.2.6.2 EnsureEvaluated adjusted
    function ensureEvaluated(module, seen, loader) {
      if (module.evaluated || !module.dependencies)
        return;

      seen.push(module);

      var deps = module.dependencies;

      for (var i = 0; i < deps.length; i++) {
        var dep = deps[i];
        if (indexOf.call(seen, dep) == -1)
          ensureEvaluated(dep, seen, loader);
      }

      if (module.evaluated)
        return;

      module.evaluated = true;
      module.execute.call(__global);
      module.module = Module(module.exports);
      delete module.execute;
    }

    // Loader
    function Loader(options) {
      if (typeof options != 'object')
        throw new TypeError('Options must be an object');

      if (options.normalize)
        this.normalize = options.normalize;
      if (options.locate)
        this.locate = options.locate;
      if (options.fetch)
        this.fetch = options.fetch;
      if (options.translate)
        this.translate = options.translate;
      if (options.instantiate)
        this.instantiate = options.instantiate;

      this._loader = {
        loaderObj: this,
        loads: [],
        modules: {}
      };

      defineProperty(this, 'global', {
        get: function() {
          return __global;
        }
      });
      defineProperty(this, 'realm', {
        get: function() {
          throw new TypeError('Realms not implemented in polyfill');
        }
      });
    }

    // importPromises adds ability to import a module twice without error - https://bugs.ecmascript.org/show_bug.cgi?id=2601
    var importPromises = {};
    Loader.prototype = {
      define: function(name, source, options) {
        if (importPromises[name])
          throw new TypeError('Module is already loading.');
        importPromises[name] = new Promise(asyncStartLoadPartwayThrough({
          step: options && options.address ? 'fetch' : 'translate',
          loader: this._loader,
          moduleName: name,
          moduleMetadata: options && options.metadata || {},
          moduleSource: source,
          moduleAddress: options && options.address
        }));
        return importPromises[name].then(function() { delete importPromises[name]; });
      },
      load: function(request, options) {
        if (this._loader.modules[request]) {
          ensureEvaluated(this._loader.modules[request], [], this._loader);
          return Promise.resolve(this._loader.modules[request].module);
        }
        if (importPromises[request])
          return importPromises[request];
        importPromises[request] = loadModule(this._loader, request, {});
        return importPromises[request].then(function() { delete importPromises[request]; })
      },
      module: function(source, options) {
        var load = createLoad();
        load.address = options && options.address;
        var linkSet = createLinkSet(this._loader, load);
        var sourcePromise = Promise.resolve(source);
        var loader = this._loader;
        var p = linkSet.done.then(function() {
          return evaluateLoadedModule(loader, load);
        });
        proceedToTranslate(loader, load, sourcePromise);
        return p;
      },
      'import': function(name, options) {
        // run normalize first
        var loaderObj = this;

        // added, see https://bugs.ecmascript.org/show_bug.cgi?id=2659
        return Promise.resolve(loaderObj.normalize(name, options && options.name, options && options.address))
        .then(function(name) {
          var loader = loaderObj._loader;
          
          if (loader.modules[name]) {
            ensureEvaluated(loader.modules[name], [], loader._loader);
            return Promise.resolve(loader.modules[name].module);
          }
          
          return (importPromises[name] || (importPromises[name] = loadModule(loader, name, options || {})))
            .then(function(load) {
              delete importPromises[name];
              return evaluateLoadedModule(loader, load);
            });
        });
      },
      eval: function(source) {
        throw new TypeError('Eval not implemented in polyfill')
      },
      get: function(key) {
        if (!this._loader.modules[key])
          return;
        ensureEvaluated(this._loader.modules[key], [], this);
        return this._loader.modules[key].module;
      },
      has: function(name) {
        return !!this._loader.modules[name];
      },
      set: function(name, module) {
        if (!(module.__esModule))
          throw new TypeError('Set must be a module');
        this._loader.modules[name] = {
          module: module
        };
      },
      'delete': function(name) {
        return this._loader.modules[name] ? delete this._loader.modules[name] : false;
      },
      // NB implement iterations
      entries: function() {
        throw new TypeError('Iteration not yet implemented in the polyfill');
      },
      keys: function() {
        throw new TypeError('Iteration not yet implemented in the polyfill');
      },
      values: function() {
        throw new TypeError('Iteration not yet implemented in the polyfill');
      },
      normalize: function(name, referrerName, referrerAddress) {
        return name;
      },
      locate: function(load) {
        return load.name;
      },
      fetch: function(load) {
        throw new TypeError('Fetch not implemented');
      },
      translate: function(load) {
        return load.source;
      },
      instantiate: function(load) {
      }
    };

    // tree traversal, NB should use visitor pattern here
    function traverse(object, iterator, parent, parentProperty) {
      var key, child;
      if (iterator(object, parent, parentProperty) === false)
        return;
      for (key in object) {
        if (!object.hasOwnProperty(key))
          continue;
        if (key == 'location' || key == 'type')
          continue;
        child = object[key];
        if (typeof child == 'object' && child !== null)
          traverse(child, iterator, object, key);
      }
    }

    // given a syntax tree, return the import list
    function getImports(moduleTree) {
      var imports = [];

      function addImport(name) {
        if (indexOf.call(imports, name) == -1)
          imports.push(name);
      }

      traverse(moduleTree, function(node) {
        // import {} from 'foo';
        // export * from 'foo';
        // export { ... } from 'foo';
        // module x from 'foo';
        if (node.type == 'EXPORT_DECLARATION') {
          if (node.declaration.moduleSpecifier)
            addImport(node.declaration.moduleSpecifier.token.processedValue);
        }
        else if (node.type == 'IMPORT_DECLARATION')
          addImport(node.moduleSpecifier.token.processedValue);
        else if (node.type == 'MODULE_DECLARATION')
          addImport(node.expression.token.processedValue);
      });
      return imports;
    }
    var anonCnt = 0;

    // Module Object
    function Module(obj) {
      if (typeof obj != 'object')
        throw new TypeError('Expected object');

      var self = {
        __esModule: true
      };

      for (var key in obj) {
        (function (key) {
          defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function () {
              return obj[key];
            }
          });
        })(key);
      }

      if (Object.preventExtensions)
        Object.preventExtensions(self);

      return self;
    }


    if (typeof exports === 'object')
      module.exports = Loader;

    __global.Reflect = __global.Reflect || {};
    __global.Reflect.Loader = __global.Reflect.Loader || Loader;
    __global.LoaderPolyfill = Loader;
    __global.Module = Module;

  })();

  function __eval(__source, __global, __moduleName) {
    eval('var __moduleName = "' + (__moduleName || '').replace('"', '\"') + '"; with(__global) { (function() { ' + __source + ' \n }).call(__global); }');
  }

})(typeof global !== 'undefined' ? global : this);

/*
*********************************************************************************************

  System Loader Implementation

    - Implemented to https://github.com/jorendorff/js-loaders/blob/master/browser-loader.js

    - <script type="module"> supported

*********************************************************************************************
*/

(function (global) {
  var isBrowser = typeof window != 'undefined';
  var Loader = global.Reflect && global.Reflect.Loader || require('./loader');
  var Promise = global.Promise || require('es6-promise').Promise;

  // Helpers
  // Absolute URL parsing, from https://gist.github.com/Yaffle/1088850
  function parseURI(url) {
    var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
    // authority = '//' + user + ':' + pass '@' + hostname + ':' port
    return (m ? {
      href     : m[0] || '',
      protocol : m[1] || '',
      authority: m[2] || '',
      host     : m[3] || '',
      hostname : m[4] || '',
      port     : m[5] || '',
      pathname : m[6] || '',
      search   : m[7] || '',
      hash     : m[8] || ''
    } : null);
  }
  function toAbsoluteURL(base, href) {
    function removeDotSegments(input) {
      var output = [];
      input.replace(/^(\.\.?(\/|$))+/, '')
        .replace(/\/(\.(\/|$))+/g, '/')
        .replace(/\/\.\.$/, '/../')
        .replace(/\/?[^\/]*/g, function (p) {
          if (p === '/..')
            output.pop();
          else
            output.push(p);
      });
      return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
    }

    href = parseURI(href || '');
    base = parseURI(base || '');

    return !href || !base ? null : (href.protocol || base.protocol) +
      (href.protocol || href.authority ? href.authority : base.authority) +
      removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
      (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
      href.hash;
  }

  var fetchTextFromURL;
  if (isBrowser) {
    fetchTextFromURL = function(url, fulfill, reject) {
      var xhr = new XMLHttpRequest();
      var sameDomain = true;
      if (!('withCredentials' in xhr)) {
        // check if same domain
        var domainCheck = /^(\w+:)?\/\/([^\/]+)/.exec(url);
        if (domainCheck) {
          sameDomain = domainCheck[2] === window.location.host;
          if (domainCheck[1])
            sameDomain &= domainCheck[1] === window.location.protocol;
        }
      }
      if (!sameDomain) {
        xhr = new XDomainRequest();
        xhr.onload = load;
        xhr.onerror = error;
        xhr.ontimeout = error;
      }
      function load() {
        fulfill(xhr.responseText);
      }
      function error() {
        reject(xhr.statusText + ': ' + url || 'XHR error');
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || (xhr.status == 0 && xhr.responseText)) {
            load();
          } else {
            error();
          }
        }
      };
      xhr.open("GET", url, true);
      xhr.send(null);
    }
  }
  else {
    var fs = require('fs');
    fetchTextFromURL = function(url, fulfill, reject) {
      return fs.readFile(url, function(err, data) {
        if (err)
          return reject(err);
        else
          fulfill(data + '');
      });
    }
  }

  var System = new Loader({
    global: isBrowser ? window : global,
    strict: true,
    normalize: function(name, parentName, parentAddress) {
      if (typeof name != 'string')
        throw new TypeError('Module name must be a string');

      var segments = name.split('/');

      if (segments.length == 0)
        throw new TypeError('No module name provided');

      // current segment
      var i = 0;
      // is the module name relative
      var rel = false;
      // number of backtracking segments
      var dotdots = 0;
      if (segments[0] == '.') {
        i++;
        if (i == segments.length)
          throw new TypeError('Illegal module name "' + name + '"');
        rel = true;
      }
      else {
        while (segments[i] == '..') {
          i++;
          if (i == segments.length)
            throw new TypeError('Illegal module name "' + name + '"');
        }
        if (i)
          rel = true;
        dotdots = i;
      }

      for (var j = i; j < segments.length; j++) {
        var segment = segments[j];
        if (segment == '' || segment == '.' || segment == '..')
          throw new TypeError('Illegal module name "' + name + '"');
      }

      if (!rel)
        return name;

      // build the full module name
      var normalizedParts = [];
      var parentParts = (parentName || '').split('/');
      var normalizedLen = parentParts.length - 1 - dotdots;

      normalizedParts = normalizedParts.concat(parentParts.splice(0, parentParts.length - 1 - dotdots));
      normalizedParts = normalizedParts.concat(segments.splice(i, segments.length - i));

      return normalizedParts.join('/');
    },
    locate: function(load) {
      var name = load.name;

      // NB no specification provided for System.paths, used ideas discussed in https://github.com/jorendorff/js-loaders/issues/25

      // most specific (longest) match wins
      var pathMatch = '', wildcard;

      // check to see if we have a paths entry
      for (var p in this.paths) {
        var pathParts = p.split('*');
        if (pathParts.length > 2)
          throw new TypeError('Only one wildcard in a path is permitted');

        // exact path match
        if (pathParts.length == 1) {
          if (name == p && p.length > pathMatch.length)
            pathMatch = p;
        }

        // wildcard path match
        else {
          if (name.substr(0, pathParts[0].length) == pathParts[0] && name.substr(name.length - pathParts[1].length) == pathParts[1]) {
            pathMatch = p;
            wildcard = name.substr(pathParts[0].length, name.length - pathParts[1].length - pathParts[0].length);
          }
        }
      }

      var outPath = this.paths[pathMatch];
      if (wildcard)
        outPath = outPath.replace('*', wildcard);

      return toAbsoluteURL(this.baseURL, outPath);
    },
    fetch: function(load) {
      return new Promise(function(resolve, reject) {
        fetchTextFromURL(toAbsoluteURL(this.baseURL, load.address), function(source) {
          resolve(source);
        }, reject);
      });
    }
  });

  if (isBrowser) {
    var href = window.location.href.split('#')[0].split('?')[0];
    System.baseURL = href.substring(0, href.lastIndexOf('/') + 1);
  }
  else {
    System.baseURL = './';
  }
  System.paths = { '*': '*.js' };

  if (global.System && global.traceur)
    global.traceurSystem = global.System;

  if (isBrowser)
    global.System = System;

  // <script type="module"> support
  // allow a data-init function callback once loaded
  if (isBrowser) {
    var curScript = document.getElementsByTagName('script');
    curScript = curScript[curScript.length - 1];

    function completed() {
      document.removeEventListener( "DOMContentLoaded", completed, false );
      window.removeEventListener( "load", completed, false );
      ready();
    }

    function ready() {
      var scripts = document.getElementsByTagName('script');

      for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.type == 'module') {
          var source = script.innerHTML;
          System.module(source)['catch'](function(err) { setTimeout(function() { throw err; }); });
        }
      }
    }

    // DOM ready, taken from https://github.com/jquery/jquery/blob/master/src/core/ready.js#L63
    if (document.readyState === 'complete') {
      setTimeout(ready);
    }
    else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', completed, false);
      window.addEventListener('load', completed, false);
    }

    // run the data-init function on the script tag
    if (curScript.getAttribute('data-init'))
      window[curScript.getAttribute('data-init')]();
  }

  if (typeof exports === 'object')
    module.exports = System;

})(typeof global !== 'undefined' ? global : this);

/*
 * SystemJS v0.6.2
 * 
 * Copyright (c) 2014 Guy Bedford
 * MIT License
 */

(function(__$global) {

  var extend = function(d, s){
    for(var prop in s) {
      d[prop] = s[prop];
    }
    return d;
  };

  var cloneSystemLoader = function(System){
    var Loader = __$global.Loader || __$global.LoaderPolyfill;
    var loader = new Loader(System);
    loader.baseURL = System.baseURL;
    loader.paths = extend({}, System.paths);
    loader.originalSystem = extend({}, System);
    return loader;
  };

var __upgradeSystemLoader = function(baseLoader) {

  // indexOf polyfill for IE
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  };

  // Absolute URL parsing, from https://gist.github.com/Yaffle/1088850
  function parseURI(url) {
    var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
    // authority = '//' + user + ':' + pass '@' + hostname + ':' port
    return (m ? {
      href     : m[0] || '',
      protocol : m[1] || '',
      authority: m[2] || '',
      host     : m[3] || '',
      hostname : m[4] || '',
      port     : m[5] || '',
      pathname : m[6] || '',
      search   : m[7] || '',
      hash     : m[8] || ''
    } : null);
  }
  function toAbsoluteURL(base, href) {
    function removeDotSegments(input) {
      var output = [];
      input.replace(/^(\.\.?(\/|$))+/, '')
        .replace(/\/(\.(\/|$))+/g, '/')
        .replace(/\/\.\.$/, '/../')
        .replace(/\/?[^\/]*/g, function (p) {
          if (p === '/..')
            output.pop();
          else
            output.push(p);
      });
      return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
    }

    href = parseURI(href || '');
    base = parseURI(base || '');

    return !href || !base ? null : (href.protocol || base.protocol) +
      (href.protocol || href.authority ? href.authority : base.authority) +
      removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
      (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
      href.hash;
  }

  var System = cloneSystemLoader(baseLoader);

  System.noConflict = function() {
    __$global.SystemJS = System;
    __$global.System = System.originalSystem;
  };
/*
 * Meta Extension
 *
 * Sets default metadata on a load record (load.metadata) from
 * loader.meta[moduleName].
 * Also provides an inline meta syntax for module meta in source.
 *
 * Eg:
 *
 * loader.meta['my/module'] = { some: 'meta' };
 *
 * load.metadata.some = 'meta' will now be set on the load record.
 *
 * The same meta could be set with a my/module.js file containing:
 * 
 * my/module.js
 *   "some meta"; 
 *   "another meta";
 *   console.log('this is my/module');
 *
 * The benefit of inline meta is that coniguration doesn't need
 * to be known in advanced, which is useful for modularising
 * configuration and avoiding the need for configuration injection.
 *
 *
 * Example
 * -------
 *
 * The simplest meta example is setting the module format:
 *
 * System.meta['my/module'] = { format: 'amd' };
 *
 * or inside 'my/module.js':
 *
 * "format amd";
 * define(...);
 * 
 */

function meta(loader) {
  var metaRegEx = /^(\s*\/\*.*\*\/|\s*\/\/[^\n]*|\s*"[^"]+"\s*;?|\s*'[^']+'\s*;?)+/;
  var metaPartRegEx = /\/\*.*\*\/|\/\/[^\n]*|"[^"]+"\s*;?|'[^']+'\s*;?/g;

  loader.meta = {};

  function setConfigMeta(loader, load) {
    var meta = loader.meta && loader.meta[load.name];
    if (meta) {
      for (var p in meta)
        load.metadata[p] = load.metadata[p] || meta[p];
    }
  }

  var loaderLocate = loader.locate;
  loader.locate = function(load) {
    setConfigMeta(this, load);
    return loaderLocate.call(this, load);
  }

  var loaderTranslate = loader.translate;
  loader.translate = function(load) {
    // detect any meta header syntax
    var meta = load.source.match(metaRegEx);
    if (meta) {
      var metaParts = meta[0].match(metaPartRegEx);
      for (var i = 0; i < metaParts.length; i++) {
        var len = metaParts[i].length;

        var firstChar = metaParts[i].substr(0, 1);
        if (metaParts[i].substr(len - 1, 1) == ';')
          len--;
      
        if (firstChar != '"' && firstChar != "'")
          continue;

        var metaString = metaParts[i].substr(1, metaParts[i].length - 3);

        var metaName = metaString.substr(0, metaString.indexOf(' '));
        if (metaName) {
          var metaValue = metaString.substr(metaName.length + 1, metaString.length - metaName.length - 1);

          if (load.metadata[metaName] instanceof Array)
            load.metadata[metaName].push(metaValue);
          else
            load.metadata[metaName] = metaValue;
        }
      }
    }
    // config meta overrides
    setConfigMeta(this, load);
    
    return loaderTranslate.call(this, load);
  }
}/*
 * Instantiate registry extension
 *
 * Supports Traceur System.register 'instantiate' output for loading ES6 as ES5.
 *
 * - Creates the loader.register function
 * - Also supports metadata.format = 'register' in instantiate for anonymous register modules
 * - Also supports metadata.deps, metadata.execute and metadata.executingRequire
 *     for handling dynamic modules alongside register-transformed ES6 modules
 *
 * Works as a standalone extension, but benefits from having a more 
 * advanced __eval defined like in SystemJS polyfill-wrapper-end.js
 *
 * The code here replicates the ES6 linking groups algorithm to ensure that
 * circular ES6 compiled into System.register can work alongside circular AMD 
 * and CommonJS, identically to the actual ES6 loader.
 *
 */
function register(loader) {
  if (typeof indexOf == 'undefined')
    indexOf = Array.prototype.indexOf;
  if (typeof __eval == 'undefined')
    __eval = 0 || eval; // uglify breaks without the 0 ||

  // define exec for easy evaluation of a load record (load.name, load.source, load.address)
  // main feature is source maps support handling
  var curSystem, curModule;
  function exec(load) {
    var loader = this;
    if (load.name == '@traceur') {
      curSystem = System;
      curModule = Module;
    }
    // support sourceMappingURL (efficiently)
    var sourceMappingURL;
    var lastLineIndex = load.source.lastIndexOf('\n');
    if (lastLineIndex != -1) {
      if (load.source.substr(lastLineIndex + 1, 21) == '//# sourceMappingURL=') {
        sourceMappingURL = load.source.substr(lastLineIndex + 22, load.source.length - lastLineIndex - 22);
        if (typeof toAbsoluteURL != 'undefined')
          sourceMappingURL = toAbsoluteURL(load.address, sourceMappingURL);
      }
    }

    __eval(load.source, loader.global, load.address, sourceMappingURL);

    // traceur overwrites System and Module - write them back
    if (load.name == '@traceur') {
      loader.global.traceurSystem = loader.global.System;
      loader.global.System = curSystem;
      //loader.global.Module = curModule;
    }
  }
  loader.__exec = exec;

  function dedupe(deps) {
    var newDeps = [];
    for (var i = 0; i < deps.length; i++)
      if (indexOf.call(newDeps, deps[i]) == -1)
        newDeps.push(deps[i])
    return newDeps;
  }

  // There are two variations of System.register:
  // 1. System.register for ES6 conversion (2-3 params) - System.register([name, ]deps, declare)
  //    see https://github.com/ModuleLoader/es6-module-loader/wiki/System.register-Explained
  //
  // 2. System.register for dynamic modules (3-4 params) - System.register([name, ]deps, executingRequire, execute)
  // the true or false statement 

  // this extension implements the linking algorithm for the two variations identical to the spec
  // allowing compiled ES6 circular references to work alongside AMD and CJS circular references.

  // loader.register sets loader.defined for declarative modules
  var anonRegister;
  var calledRegister;
  function register(name, deps, declare, execute) {
    if (typeof name != 'string') {
      execute = declare;
      declare = deps;
      deps = name;
      name = null;
    }

    calledRegister = true;
    
    var register;

    // dynamic
    if (typeof declare == 'boolean') {
      register = {
        declarative: false,
        deps: deps,
        execute: execute,
        executingRequire: declare
      };
    }
    else {
      // ES6 declarative
      if (deps.length > 0 && declare.length != 1)
        throw 'Invalid System.register form for ' + name + '. Declare function must take one argument.';
      register = {
        declarative: true,
        deps: deps,
        declare: declare
      };
    }
    
    // named register
    if (name) {
      // we never overwrite an existing define
      if (!loader.defined[name])
        loader.defined[name] = register; 
    }
    // anonymous register
    else if (register.declarative) {
      if (anonRegister)
        throw 'Multiple anonymous System.register calls in the same module file.';
      anonRegister = register;
    }
  }

  // Registry side table - loader.defined
  // Registry Entry Contains:
  //    - deps 
  //    - declare for register modules
  //    - execute for dynamic modules, also after declare for declarative modules
  //    - executingRequire indicates require drives execution for circularity of dynamic modules
  //    - declarative optional boolean indicating which of the above
  //
  // Can preload modules directly on System.defined['my/module'] = { deps, execute, executingRequire }
  //
  // Then the entry gets populated with derived information during processing:
  //    - normalizedDeps derived from deps, created in instantiate
  //    - depMap array derived from deps, populated gradually in link
  //    - groupIndex used by group linking algorithm
  //    - module a raw module exports object with no wrapper
  //    - evaluated indiciating whether evaluation has happend for declarative modules
  // After linked and evaluated, entries are removed

  function defineRegister(loader) {
    if (loader.register)
      return;

    loader.register = register;

    if (!loader.defined)
      loader.defined = {};
    
    // script injection mode calls this function synchronously on load
    var onScriptLoad = loader.onScriptLoad;
    loader.onScriptLoad = function(load) {
      onScriptLoad(load);
      // anonymous define
      if (anonRegister)
        load.metadata.entry = anonRegister;
      
      if (anonRegister || calledRegister)
        load.metadata.format = load.metadata.format || 'register';
      if (calledRegister)
        load.metadata.registered = true;
    }
  }

  defineRegister(loader);

  function buildGroups(entry, loader, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0; i < entry.normalizedDeps.length; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = loader.defined[depName];
      
      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;
      
      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {
        
        // if already in a group, remove from the old group
        if (depEntry.groupIndex) {
          groups[depEntry.groupIndex].splice(groups[depEntry.groupIndex].indexOf(depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, loader, groups);
    }
  }

  function link(name, loader) {
    var startEntry = loader.defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, loader, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry, loader);
        else
          linkDynamicModule(entry, loader);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  function linkDeclarativeModule(entry, loader) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    // declare the module with an empty depMap
    var depMap = [];

    var declaration = entry.declare.call(loader.global, depMap);
    
    entry.module = declaration.exports;
    entry.exportStar = declaration.exportStar;
    entry.execute = declaration.execute;

    var module = entry.module;

    // now link all the module dependencies
    // amending the depMap as we go
    for (var i = 0; i < entry.normalizedDeps.length; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = loader.defined[depName];
      
      // part of another linking group - use loader.get
      if (!depEntry) {
        depModule = loader.get(depName);
      }
      // if dependency already linked, use that
      else if (depEntry.module) {
        depModule = depEntry.module;
      }
      // otherwise we need to link the dependency
      else {
        linkDeclarativeModule(depEntry, loader);
        depModule = depEntry.module;
      }

      if (entry.exportStar && indexOf.call(entry.exportStar, entry.normalizedDeps[i]) != -1) {
        // we are exporting * from this dependency
        (function(depModule) {
          for (var p in depModule) (function(p) {
            // if the property is already defined throw?
            Object.defineProperty(module, p, {
              enumerable: true,
              get: function() {
                return depModule[p];
              },
              set: function(value) {
                depModule[p] = value;
              }
            });
          })(p);
        })(depModule);
      }

      depMap[i] = depModule;
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name, loader) {
    var module;
    var entry = loader.defined[name];

    if (!entry) {
      module = loader.get(name);
      if (!module)
        throw "System Register: The module requested " + name + " but this was not declared as a dependency";
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, [], loader);
    
      else if (!entry.evaluated)
        linkDynamicModule(entry, loader);

      module = entry.module;
    }

    if (!module)
      return '';

    return module.__useDefault ? module['default'] : module;
  }

  function linkDynamicModule(entry, loader) {
    if (entry.module)
      return;

    entry.module = { 'default': {}, __useDefault: true };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0; i < entry.normalizedDeps.length; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = loader.defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry, loader);
      }
    }

    // lookup the module name if it is in the registry
    var moduleName;
    for (var d in loader.defined) {
      if (loader.defined[d] != entry)
        continue;
      moduleName = d;
      break;
    }

    // now execute
    try {
      entry.evaluated = true;
      var output = entry.execute.call(loader.global, function(name) {
        for (var i = 0; i < entry.deps.length; i++) {
          if (entry.deps[i] != name)
            continue;
          return getModule(entry.normalizedDeps[i], loader);
        }
      }, entry.module['default'], moduleName);
    }
    catch(e) {
      throw e;
    }
    
    if (output && output.__esModule)
      entry.module = output;
    else if (output)
      entry.module['default'] = output;
  }

  // given a module, and the list of modules for this current branch,
  // ensure that each of the dependencies of this module is evaluated
  //  (unless one is a circular dependency already in the list of seen
  //   modules, in which case we execute it)
  // then evaluate the module itself
  // depth-first left to right execution to match ES6 modules
  function ensureEvaluated(moduleName, seen, loader) {
    var entry = loader.defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (entry.evaluated || !entry.declarative)
      return;

    seen.push(moduleName);

    for (var i = 0; i < entry.normalizedDeps.length; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!loader.defined[depName])
          loader.get(depName);
        else
          ensureEvaluated(depName, seen, loader);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.execute.call(loader.global);
  }

  var registerRegEx = /System\.register/;

  var loaderFetch = loader.fetch;
  loader.fetch = function(load) {
    var loader = this;
    defineRegister(loader);
    if (loader.defined[load.name]) {
      load.metadata.format = 'defined';
      return '';
    }
    anonRegister = null;
    calledRegister = false;
    // the above get picked up by onScriptLoad
    return loaderFetch.call(loader, load);
  }

  var loaderTranslate = loader.translate;
  loader.translate = function(load) {
    this.register = register;

    this.__exec = exec;

    load.metadata.deps = load.metadata.deps || [];

    // we run the meta detection here (register is after meta)
    return Promise.resolve(loaderTranslate.call(this, load)).then(function(source) {
      
      // dont run format detection for globals shimmed
      // ideally this should be in the global extension, but there is
      // currently no neat way to separate it
      if (load.metadata.init || load.metadata.exports)
        load.metadata.format = load.metadata.format || 'global';

      // run detection for register format
      if (load.metadata.format == 'register' || !load.metadata.format && load.source.match(registerRegEx))
        load.metadata.format = 'register';
      return source;
    });
  }


  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;

    var entry;

    // first we check if this module has already been defined in the registry
    if (loader.defined[load.name])
      entry = loader.defined[load.name];

    // picked up already by a script injection
    else if (load.metadata.entry)
      entry = load.metadata.entry;

    // otherwise check if it is dynamic
    else if (load.metadata.execute) {
      entry = {
        declarative: false,
        deps: load.metadata.deps || [],
        execute: load.metadata.execute,
        executingRequire: load.metadata.executingRequire // NodeJS-style requires or not
      };
    }

    // Contains System.register calls
    else if (load.metadata.format == 'register') {
      anonRegister = null;
      calledRegister = false;

      loader.__exec(load);

      if (anonRegister)
        entry = anonRegister;

      if (!calledRegister && !load.metadata.registered)
        throw load.name + " detected as System.register but didn't execute.";
    }

    // named bundles are just an empty module
    if (!entry && load.metadata.format != 'es6')
      return {
        deps: [],
        execute: function() {
          return Module({});
        }
      };

    // place this module onto defined for circular references
    if (entry)
      loader.defined[load.name] = entry;

    // no entry -> treat as ES6
    else
      return loaderInstantiate.call(this, load);

    entry.deps = dedupe(entry.deps);

    // first, normalize all dependencies
    var normalizePromises = [];
    for (var i = 0; i < entry.deps.length; i++)
      normalizePromises.push(Promise.resolve(loader.normalize(entry.deps[i], load.name)));

    return Promise.all(normalizePromises).then(function(normalizedDeps) {

      entry.normalizedDeps = normalizedDeps;

      // create the empty dep map - this is our key deferred dependency binding object passed into declare
      entry.depMap = [];

      return {
        deps: entry.deps,
        execute: function() {
          // this avoids double duplication allowing a bundle to equal its last defined module
          if (entry.esmodule) {
            delete loader.defined[load.name];
            return entry.esmodule;
          }

          // recursively ensure that the module and all its 
          // dependencies are linked (with dependency group handling)
          link(load.name, loader);

          // now handle dependency execution in correct order
          ensureEvaluated(load.name, [], loader);

          // remove from the registry
          delete loader.defined[load.name];

          var module = Module(entry.module);

          // if the entry is an alias, set the alias too
          for (var name in loader.defined) {
            if (entry.declarative && loader.defined[name].execute != entry.execute)
              continue;
            if (!entry.declarative && loader.defined[name].declare != entry.declare);
              continue;
            loader.defined[name].esmodule = module;
          }
          // return the defined module object
          return module;
        }
      };
    });
  }
}
/*
 * SystemJS Core
 * Code should be vaguely readable
 * 
 */
function core(loader) {

  /*
    __useDefault
    
    When a module object looks like:
    Module({
      __useDefault: true,
      default: 'some-module'
    })

    Then importing that module provides the 'some-module'
    result directly instead of the full module.

    Useful for eg module.exports = function() {}
  */
  var loaderImport = loader['import'];
  loader['import'] = function(name, options) {
    return loaderImport.call(this, name, options).then(function(module) {
      return module.__useDefault ? module['default'] : module;
    });
  };

  // support the empty module, as a concept
  loader.set('@empty', Module({}));

  /*
    Config
    Extends config merging one deep only

    loader.config({
      some: 'random',
      config: 'here',
      deep: {
        config: { too: 'too' }
      }
    });

    <=>

    loader.some = 'random';
    loader.config = 'here'
    loader.deep = loader.deep || {};
    loader.deep.config = { too: 'too' };
  */
  loader.config = function(cfg) {
    for (var c in cfg) {
      var v = cfg[c];
      if (typeof v == 'object') {
        this[c] = this[c] || {};
        for (var p in v)
          this[c][p] = v[p];
      }
      else
        this[c] = v;
    }
  };

  // override locate to allow baseURL to be document-relative
  var baseURI;
  if (typeof window == 'undefined') {
    baseURI = process.cwd() + '/';
  }
  else {
    baseURI = document.baseURI;
    if (!baseURI) {
      var bases = document.getElementsByTagName('base');
      baseURI = bases[0] && bases[0].href || window.location.href;
    }
  }

  var loaderLocate = loader.locate;
  var normalizedBaseURL;
  loader.locate = function(load) {
    if (this.baseURL != normalizedBaseURL) {
      normalizedBaseURL = toAbsoluteURL(baseURI, this.baseURL);

      if (normalizedBaseURL.substr(normalizedBaseURL.length - 1, 1) != '/')
        normalizedBaseURL += '/';
      this.baseURL = normalizedBaseURL;
    }

    return Promise.resolve(loaderLocate.call(this, load));
  };


  // Traceur conveniences
  var aliasRegEx = /^\s*export\s*\*\s*from\s*(?:'([^']+)'|"([^"]+)")/;
  var es6RegEx = /(?:^\s*|[}{\(\);,\n]\s*)(import\s+['"]|(import|module)\s+[^"'\(\)\n;]+\s+from\s+['"]|export\s+(\*|\{|default|function|var|const|let|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*))/;

  var loaderTranslate = loader.translate;
  loader.translate = function(load) {
    var loader = this;

    if (load.name == '@traceur')
      return loaderTranslate.call(loader, load);

    // support ES6 alias modules ("export * from 'module';") without needing Traceur
    var match;
    if ((load.metadata.format == 'es6' || !load.metadata.format) && (match = load.source.match(aliasRegEx))) {
      load.metadata.format = 'cjs';
      load.source = 'module.exports = require("' + (match[1] || match[2]) + '");\n';
    }

    // detect ES6
    else if (load.metadata.format == 'es6' || !load.metadata.format && load.source.match(es6RegEx)) {
      load.metadata.format = 'es6';

      // dynamically load Traceur for ES6 if necessary
      if (!loader.global.traceur) {
        return loader['import']('@traceur').then(function() {
          return loaderTranslate.call(loader, load);
        });
      }
    }

    return loaderTranslate.call(loader, load);
  };

  // always load Traceur as a global
  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;
    if (load.name == '@traceur') {
      loader.__exec(load);
      return {
        deps: [],
        execute: function() {
          return Module({});
        }
      };
    }
    return loaderInstantiate.call(loader, load);
  };
}
/*
  SystemJS Global Format

  Supports
    metadata.deps
    metadata.init
    metadata.exports

  Also detects writes to the global object avoiding global collisions.
  See the SystemJS readme global support section for further information.
*/
function global(loader) {
  function createHelpers(loader) {
    if (loader.has('@@global-helpers'))
      return;

    var hasOwnProperty = loader.global.hasOwnProperty;
    var moduleGlobals = {};

    var curGlobalObj;
    var ignoredGlobalProps;

    loader.set('@@global-helpers', Module({
      prepareGlobal: function(moduleName, deps) {
        // first, we add all the dependency modules to the global
        for (var i = 0; i < deps.length; i++) {
          var moduleGlobal = moduleGlobals[deps[i]];
          if (moduleGlobal)
            for (var m in moduleGlobal)
              loader.global[m] = moduleGlobal[m];
        }

        // now store a complete copy of the global object
        // in order to detect changes
        curGlobalObj = {};
        ignoredGlobalProps = ['indexedDB', 'sessionStorage', 'localStorage', 'clipboardData', 'frames'];
        for (var g in loader.global)
          if (!hasOwnProperty || loader.global.hasOwnProperty(g)) {
            try {
              curGlobalObj[g] = loader.global[g];
            } catch (e) {
              ignoredGlobalProps.push(g);
            }
          }
      },
      retrieveGlobal: function(moduleName, exportName, init) {
        var singleGlobal;
        var exports = {};

        // run init
        if (init) {
          var depModules = [];
          for (var i = 0; i < deps.length; i++)
            depModules.push(require(deps[i]));
          singleGlobal = init.apply(loader.global, depModules);
        }

        // check for global changes, creating the globalObject for the module
        // if many globals, then a module object for those is created
        // if one global, then that is the module directly
        if (exportName && !singleGlobal) {
          var firstPart = exportName.split('.')[0];
          singleGlobal = eval.call(loader.global, exportName);
          exports[firstPart] = loader.global[firstPart];
        }

        else {
          for (var g in loader.global) {
            if (~ignoredGlobalProps.indexOf(g))
              continue;
            if ((!hasOwnProperty || loader.global.hasOwnProperty(g)) && g != loader.global && curGlobalObj[g] != loader.global[g]) {
              exports[g] = loader.global[g];
              if (singleGlobal) {
                if (singleGlobal !== loader.global[g])
                  singleGlobal = undefined;
              }
              else if (singleGlobal !== false) {
                singleGlobal = loader.global[g];
              }
            }
          }
        }

        moduleGlobals[moduleName] = exports;

        return typeof singleGlobal != 'undefined' ? singleGlobal : exports;
      }
    }));
  }

  createHelpers(loader);

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;

    createHelpers(loader);

    var exportName = load.metadata.exports;

    if (!load.metadata.format)
      load.metadata.format = 'global';

    // global is a fallback module format
    if (load.metadata.format == 'global') {
      load.metadata.execute = function(require, exports, moduleName) {

        loader.get('@@global-helpers').prepareGlobal(moduleName, load.metadata.deps);

        if (exportName)
          load.source += '\nthis["' + exportName + '"] = ' + exportName + ';';

        // disable AMD detection
        var define = loader.global.define;
        loader.global.define = undefined;

        // ensure no NodeJS environment detection
        loader.global.module = undefined;
        loader.global.exports = undefined;

        loader.__exec(load);

        loader.global.define = define;

        return loader.get('@@global-helpers').retrieveGlobal(moduleName, exportName, load.metadata.init);
      }
    }
    return loaderInstantiate.call(loader, load);
  }
}
/*
  SystemJS CommonJS Format
*/
function cjs(loader) {

  // CJS Module Format
  // require('...') || exports[''] = ... || exports.asd = ... || module.exports = ...
  var cjsExportsRegEx = /(?:^\s*|[}{\(\);,\n=:\?\&]\s*|module\.)(exports\s*\[\s*('[^']+'|"[^"]+")\s*\]|\exports\s*\.\s*[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*|exports\s*\=)/;
  var cjsRequireRegEx = /(?:^\s*|[}{\(\);,\n=:\?\&]\s*)require\s*\(\s*("([^"]+)"|'([^']+)')\s*\)/g;
  var commentRegEx = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;

  function getCJSDeps(source) {
    cjsExportsRegEx.lastIndex = 0;
    cjsRequireRegEx.lastIndex = 0;

    var deps = [];

    // remove comments from the source first
    var source = source.replace(commentRegEx, '');

    var match;

    while (match = cjsRequireRegEx.exec(source))
      deps.push(match[2] || match[3]);

    return deps;
  }

  var noop = function() {}
  var nodeProcess = {
    nextTick: function(f) {
      setTimeout(f, 7);
    },
    browser: typeof window != 'undefined',
    env: {},
    argv: [],
    on: noop,
    once: noop,
    off: noop,
    emit: noop,
    cwd: function() { return '/' }
  };

  loader._getCJSDeps = getCJSDeps;

  if (!loader.has('@@nodeProcess'))
    loader.set('@@nodeProcess', Module({ 'default': nodeProcess, __useDefault: true }));

  var loaderTranslate = loader.translate;
  loader.translate = function(load) {
    var loader = this;
    if (!loader.has('@@nodeProcess'))
      loader.set('@@nodeProcess', Module({ 'default': nodeProcess, __useDefault: true }));
    if (!loader._getCJSDeps)
      loader._getCJSDeps = getCJSDeps;
    return loaderTranslate.call(loader, load);
  }

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {

    if (!load.metadata.format) {
      cjsExportsRegEx.lastIndex = 0;
      cjsRequireRegEx.lastIndex = 0;
      if (cjsRequireRegEx.exec(load.source) || cjsExportsRegEx.exec(load.source))
        load.metadata.format = 'cjs';
    }

    if (load.metadata.format == 'cjs') {
      load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(getCJSDeps(load.source)) : load.metadata.deps;

      load.metadata.executingRequire = true;

      load.metadata.execute = function(require, exports, moduleName) {
        var dirname = load.address.split('/');
        dirname.pop();
        dirname = dirname.join('/');

        var globals = loader.global._g = {
          global: loader.global,
          exports: exports,
          module: { exports: exports },
          process: nodeProcess,
          require: require,
          __filename: load.address,
          __dirname: dirname
        };

        var glString = '';
        for (var _g in globals)
          glString += 'var ' + _g + ' = _g.' + _g + ';';

        // disable AMD detection
        var define = loader.global.define;
        loader.global.define = undefined;

        var execLoad = {
          name: load.name,
          source: '(function() { ' + glString + '(function() { ' + load.source + '\n}).call(this); }).call(exports)',
          address: load.address
        };
        loader.__exec(execLoad);

        loader.global.define = define;

        loader.global._g = undefined;

        return globals.module.exports;
      }
    }

    return loaderInstantiate.call(this, load);
  };
}/*
  SystemJS AMD Format
  Provides the AMD module format definition at System.format.amd
  as well as a RequireJS-style require on System.require
*/
function amd(loader) {

  var isNode = typeof module != 'undefined' && module.exports;

  // AMD Module Format Detection RegEx
  // define([.., .., ..], ...)
  // define(varName); || define(function(require, exports) {}); || define({})
  var amdRegEx = /(?:^\s*|[}{\(\);,\n\?\&]\s*)define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?\s*(\[(\s*("[^"]+"|'[^']+')\s*,)*(\s*("[^"]+"|'[^']+')\s*)?\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.require
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
        callback.apply(null, modules);
      }, errback);

    // commonjs require
    else if (typeof names == 'string') {
      var module = loader.get(names);
      return module.__useDefault ? module['default'] : module;
    }

    else
      throw 'Invalid require';
  };
  loader.require = require;

  function makeRequire(parentName, staticRequire, loader) {
    return function(names, callback, errback) {
      if (typeof names == 'string')
        return staticRequire(names);
      return require.call(loader, names, callback, errback, { name: parentName });
    }
  }

  var anonDefine;
  // set to true of the current module turns out to be a named define bundle
  var defineBundle;
  function createDefine(loader) {
    anonDefine = null;
    defineBundle = null;

    // ensure no NodeJS environment detection
    loader.global.module = undefined;
    loader.global.exports = undefined;

    if (loader.global.define && loader.global.define.loader == loader)
      return;

    // script injection mode calls this function synchronously on load
    var onScriptLoad = loader.onScriptLoad;
    loader.onScriptLoad = function(load) {
      onScriptLoad(load);
      if (anonDefine || defineBundle)
        load.metadata.format = 'defined';

      if (anonDefine) {
        load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(anonDefine.deps) : anonDefine.deps;
        load.metadata.execute = anonDefine.execute;
      }
    }

    function define(name, deps, factory) {
      if (typeof name != 'string') {
        factory = deps;
        deps = name;
        name = null;
      }
      if (!(deps instanceof Array)) {
        factory = deps;
        // CommonJS AMD form
        if (!loader._getCJSDeps)
          throw "AMD extension needs CJS extension for AMD CJS support";
        deps = ['require', 'exports', 'module'].concat(loader._getCJSDeps(factory.toString()));
      }

      if (typeof factory != 'function')
        factory = (function(factory) {
          return function() { return factory; }
        })(factory);

      // remove system dependencies
      var requireIndex, exportsIndex, moduleIndex
      if ((requireIndex = indexOf.call(deps, 'require')) != -1)
        deps.splice(requireIndex, 1);

      if ((exportsIndex = indexOf.call(deps, 'exports')) != -1)
        deps.splice(exportsIndex, 1);
      
      if ((moduleIndex = indexOf.call(deps, 'module')) != -1)
        deps.splice(moduleIndex, 1);

      var define = {
        deps: deps,
        execute: function(require, exports, moduleName) {

          var depValues = [];
          for (var i = 0; i < deps.length; i++)
            depValues.push(require(deps[i]));

          var module;

          // add back in system dependencies
          if (moduleIndex != -1)
            depValues.splice(moduleIndex, 0, exports, module = { id: moduleName, uri: loader.baseURL + moduleName, config: function() { return {}; }, exports: exports });
          
          if (exportsIndex != -1)
            depValues.splice(exportsIndex, 0, exports);
          
          if (requireIndex != -1)
            depValues.splice(requireIndex, 0, makeRequire(moduleName, require, loader));

          var output = factory.apply(loader.global, depValues);

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
          throw "Multiple defines for anonymous module";
        anonDefine = define;
      }
      // named define
      else {
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

    loader.amdDefine = define;
    loader.global.define = define;
    loader.global.define.amd = {};
    loader.global.define.loader = loader;
  }

  if (!isNode && loader.amdDefine !== false)
    createDefine(loader);

  if (loader.scriptLoader) {
    var loaderFetch = loader.fetch;
    loader.fetch = function(load) {
      if (loader.amdDefine !== false)
        createDefine(this);
      return loaderFetch.call(this, load);
    }
  }
  

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;

    if (load.metadata.format == 'amd' || !load.metadata.format && load.source.match(amdRegEx)) {
      load.metadata.format = 'amd';

      createDefine(loader);

      loader.__exec(load);

      if (isNode)
        loader.global.define = undefined;

      if (!anonDefine && !defineBundle && !isNode)
        throw "AMD module " + load.name + " did not define";

      if (anonDefine) {
        load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(anonDefine.deps) : anonDefine.deps;
        load.metadata.execute = anonDefine.execute;
      }
    }

    return loaderInstantiate.call(loader, load);
  }
}/*
  SystemJS map support
  
  Provides map configuration through
    System.map['jquery'] = 'some/module/map'

  As well as contextual map config through
    System.map['bootstrap'] = {
      jquery: 'some/module/map2'
    }

  Note that this applies for subpaths, just like RequireJS

  jquery      -> 'some/module/map'
  jquery/path -> 'some/module/map/path'
  bootstrap   -> 'bootstrap'

  Inside any module name of the form 'bootstrap' or 'bootstrap/*'
    jquery    -> 'some/module/map2'
    jquery/p  -> 'some/module/map2/p'

  Maps are carefully applied from most specific contextual map, to least specific global map
*/
function map(loader) {
  loader.map = loader.map || {};

  // return the number of prefix parts (separated by '/') matching the name
  // eg prefixMatchLength('jquery/some/thing', 'jquery') -> 1
  function prefixMatchLength(name, prefix) {
    var prefixParts = prefix.split('/');
    var nameParts = name.split('/');
    if (prefixParts.length > nameParts.length)
      return 0;
    for (var i = 0; i < prefixParts.length; i++)
      if (nameParts[i] != prefixParts[i])
        return 0;
    return prefixParts.length;
  }


  // given a relative-resolved module name and normalized parent name,
  // apply the map configuration
  function applyMap(name, parentName, loader) {

    var curMatch, curMatchLength = 0;
    var curParent, curParentMatchLength = 0;
    var subPath;
    var nameParts;
    
    // first find most specific contextual match
    if (parentName) {
      for (var p in loader.map) {
        var curMap = loader.map[p];
        if (typeof curMap != 'object')
          continue;

        // most specific parent match wins first
        if (prefixMatchLength(parentName, p) <= curParentMatchLength)
          continue;

        for (var q in curMap) {
          // most specific name match wins
          if (prefixMatchLength(name, q) <= curMatchLength)
            continue;

          curMatch = q;
          curMatchLength = q.split('/').length;
          curParent = p;
          curParentMatchLength = p.split('/').length;
        }
      }
    }

    // if we found a contextual match, apply it now
    if (curMatch) {
      nameParts = name.split('/');
      subPath = nameParts.splice(curMatchLength, nameParts.length - curMatchLength).join('/');
      name = loader.map[curParent][curMatch] + (subPath ? '/' + subPath : '');
      curMatchLength = 0;
    }

    // now do the global map
    for (var p in loader.map) {
      var curMap = loader.map[p];
      if (typeof curMap != 'string')
        continue;

      if (prefixMatchLength(name, p) <= curMatchLength)
        continue;

      curMatch = p;
      curMatchLength = p.split('/').length;
    }
    
    // return a match if any
    if (!curMatchLength)
      return name;
    
    nameParts = name.split('/');
    subPath = nameParts.splice(curMatchLength, nameParts.length - curMatchLength).join('/');
    return loader.map[curMatch] + (subPath ? '/' + subPath : '');
  }

  var loaderNormalize = loader.normalize;
  loader.normalize = function(name, parentName, parentAddress) {
    var loader = this;
    if (!loader.map)
      loader.map = {};

    var isPackage = false;
    if (name.substr(name.length - 1, 1) == '/') {
      isPackage = true;
      name += '#';
    }

    return Promise.resolve(loaderNormalize.call(loader, name, parentName, parentAddress))
    .then(function(name) {
      name = applyMap(name, parentName, loader);

      // Normalize "module/" into "module/module"
      // Convenient for packages
      if (isPackage) {
        var nameParts = name.split('/');
        nameParts.pop();
        var pkgName = nameParts.pop();
        nameParts.push(pkgName);
        nameParts.push(pkgName);
        name = nameParts.join('/');
      }

      return name;
    });
  }
}
/*
  SystemJS Plugin Support

  Supports plugin syntax with "!"

  The plugin name is loaded as a module itself, and can override standard loader hooks
  for the plugin resource. See the plugin section of the systemjs readme.
*/
function plugins(loader) {
  if (typeof indexOf == 'undefined')
    indexOf = Array.prototype.indexOf;

  var loaderNormalize = loader.normalize;
  loader.normalize = function(name, parentName, parentAddress) {
    var loader = this;
    // if parent is a plugin, normalize against the parent plugin argument only
    var parentPluginIndex;
    if (parentName && (parentPluginIndex = parentName.indexOf('!')) != -1)
      parentName = parentName.substr(0, parentPluginIndex);

    return Promise.resolve(loaderNormalize.call(loader, name, parentName, parentAddress))
    .then(function(name) {
      // if this is a plugin, normalize the plugin name and the argument
      var pluginIndex = name.lastIndexOf('!');
      if (pluginIndex != -1) {
        var argumentName = name.substr(0, pluginIndex);

        // plugin name is part after "!" or the extension itself
        var pluginName = name.substr(pluginIndex + 1) || argumentName.substr(argumentName.lastIndexOf('.') + 1);

        // normalize the plugin name relative to the same parent
        return new Promise(function(resolve) {
          resolve(loader.normalize(pluginName, parentName, parentAddress)); 
        })
        // normalize the plugin argument
        .then(function(_pluginName) {
          pluginName = _pluginName;
          return loader.normalize(argumentName, parentName, parentAddress);
        })
        .then(function(argumentName) {
          return argumentName + '!' + pluginName;
        });
      }

      // standard normalization
      return name;
    });
  };

  var loaderLocate = loader.locate;
  loader.locate = function(load) {
    var loader = this;

    var name = load.name;

    // plugin
    var pluginIndex = name.lastIndexOf('!');
    if (pluginIndex != -1) {
      var pluginName = name.substr(pluginIndex + 1);

      // the name to locate is the plugin argument only
      load.name = name.substr(0, pluginIndex);

      var pluginLoader = loader.pluginLoader || loader;

      // load the plugin module
      // NB ideally should use pluginLoader.load for normalized,
      //    but not currently working for some reason
      return pluginLoader['import'](pluginName)
      .then(function() {
        var plugin = pluginLoader.get(pluginName);
        plugin = plugin['default'] || plugin;

        // allow plugins to opt-out of build
        if (plugin.build === false && loader.pluginLoader)
          load.metadata.build = false;

        // store the plugin module itself on the metadata
        load.metadata.plugin = plugin;
        load.metadata.pluginName = pluginName;
        load.metadata.pluginArgument = load.name;
        load.metadata.buildType = plugin.buildType || "js";

        // run plugin locate if given
        if (plugin.locate)
          return plugin.locate.call(loader, load);

        // otherwise use standard locate without '.js' extension adding
        else
          return Promise.resolve(loader.locate(load))
          .then(function(address) {
            return address.substr(0, address.length - 3);
          });
      });
    }

    return loaderLocate.call(this, load);
  };

  var loaderFetch = loader.fetch;
  loader.fetch = function(load) {
    var loader = this;
    if (load.metadata.build === false)
      return '';
    else if (load.metadata.plugin && load.metadata.plugin.fetch && !load.metadata.pluginFetchCalled) {
      load.metadata.pluginFetchCalled = true;
      return load.metadata.plugin.fetch.call(loader, load, loaderFetch);
    }
    else
      return loaderFetch.call(loader, load);
  };

  var loaderTranslate = loader.translate;
  loader.translate = function(load) {
    var loader = this;
    if (load.metadata.plugin && load.metadata.plugin.translate)
      return Promise.resolve(load.metadata.plugin.translate.call(loader, load)).then(function(result) {
        if (result)
          return result;
        else
          return loaderTranslate.call(loader, load);
      });
    else
      return loaderTranslate.call(loader, load);
  };

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;
    if (load.metadata.plugin && load.metadata.plugin.instantiate)
      return Promise.resolve(load.metadata.plugin.instantiate.call(loader, load)).then(function(result) {
        if (result) {
          // load.metadata.format = 'defined';
          // load.metadata.execute = function() {
          //   return result;
          // };
          return result;
        }
        return loaderInstantiate.call(loader, load);
      });
    else if (load.metadata.plugin && load.metadata.plugin.build === false) {
      load.metadata.format = 'defined';
      load.metadata.deps.push(load.metadata.pluginName);
      load.metadata.execute = function() {
        return Module({});
      };
      return loaderInstantiate.call(loader, load);
    }
    else
      return loaderInstantiate.call(loader, load);
  };
}/*
  System bundles

  Allows a bundle module to be specified which will be dynamically 
  loaded before trying to load a given module.

  For example:
  System.bundles['mybundle'] = ['jquery', 'bootstrap/js/bootstrap']

  Will result in a load to "mybundle" whenever a load to "jquery"
  or "bootstrap/js/bootstrap" is made.

  In this way, the bundle becomes the request that provides the module
*/

function bundles(loader) {
  if (typeof indexOf == 'undefined')
    indexOf = Array.prototype.indexOf;

  // bundles support (just like RequireJS)
  // bundle name is module name of bundle itself
  // bundle is array of modules defined by the bundle
  // when a module in the bundle is requested, the bundle is loaded instead
  // of the form System.bundles['mybundle'] = ['jquery', 'bootstrap/js/bootstrap']
  loader.bundles = loader.bundles || {};

  var loaderFetch = loader.fetch;
  loader.fetch = function(load) {
    var loader = this;
    if (loader.trace)
      return loaderFetch.call(this, load);
    if (!loader.bundles)
      loader.bundles = {};

    // if this module is in a bundle, load the bundle first then
    for (var b in loader.bundles) {
      if (indexOf.call(loader.bundles[b], load.name) == -1)
        continue;
      // we do manual normalization in case the bundle is mapped
      // this is so we can still know the normalized name is a bundle
      return Promise.resolve(loader.normalize(b))
      .then(function(normalized) {
        loader.bundles[normalized] = loader.bundles[normalized] || loader.bundles[b];

        // note this module is a bundle in the meta
        loader.meta = loader.meta || {};
        loader.meta[normalized] = loader.meta[normalized] || {};
        loader.meta[normalized].bundle = true;

        return loader.load(normalized);
      })
      .then(function() {
        return '';
      });
    }
    return loaderFetch.call(this, load);
  };
}/*
  SystemJS Semver Version Addon
  
  1. Uses Semver convention for major and minor forms

  Supports requesting a module from a package that contains a version suffix
  with the following semver ranges:
    module       - any version
    module@1     - major version 1, any minor (not prerelease)
    module@1.2   - minor version 1.2, any patch (not prerelease)
    module@1.2.3 - exact version

  It is assumed that these modules are provided by the server / file system.

  First checks the already-requested packages to see if there are any packages 
  that would match the same package and version range.

  This provides a greedy algorithm as a simple fix for sharing version-managed
  dependencies as much as possible, which can later be optimized through version
  hint configuration created out of deeper version tree analysis.
  
  2. Semver-compatibility syntax (caret operator - ^)

  Compatible version request support is then also provided for:

    module@^1.2.3        - module@1, >=1.2.3
    module@^1.2          - module@1, >=1.2.0
    module@^1            - module@1
    module@^0.5.3        - module@0.5, >= 0.5.3
    module@^0.0.1        - module@0.0.1

  The ^ symbol is always normalized out to a normal version request.

  This provides comprehensive semver compatibility.
  
  3. System.versions version hints and version report

  Note this addon should be provided after all other normalize overrides.

  The full list of versions can be found at System.versions providing an insight
  into any possible version forks.

  It is also possible to create version solution hints on the System global:

  System.versions = {
    jquery: ['1.9.2', '2.0.3'],
    bootstrap: '3.0.1'
  };

  Versions can be an array or string for a single version.

  When a matching semver request is made (jquery@1.9, jquery@1, bootstrap@3)
  they will be converted to the latest version match contained here, if present.

  Prereleases in this versions list are also allowed to satisfy ranges when present.
*/

function versions(loader) {
  if (typeof indexOf == 'undefined')
    indexOf = Array.prototype.indexOf;

  // match x, x.y, x.y.z, x.y.z-prerelease.1
  var semverRegEx = /^(\d+)(?:\.(\d+)(?:\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?)?)?$/;

  var semverCompare = function(v1, v2) {
    var v1Parts = v1.split('.');
    var v2Parts = v2.split('.');
    var prereleaseIndex;
    if (v1Parts[2] && (prereleaseIndex = indexOf.call(v1Parts[2], '-')) != -1)
      v1Parts.splice(2, 1, v1Parts[2].substr(0, prereleaseIndex), v1Parts[2].substr(prereleaseIndex + 1));
    if (v2Parts[2] && (prereleaseIndex = indexOf.call(v2Parts[2], '-')) != -1)
      v2Parts.splice(2, 1, v2Parts[2].substr(0, prereleaseIndex), v2Parts[2].substr(prereleaseIndex + 1));
    for (var i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      if (!v1Parts[i])
        return 1;
      else if (!v2Parts[i])
        return -1;
      if (v1Parts[i] != v2Parts[i])
        return parseInt(v1Parts[i]) > parseInt(v2Parts[i]) ? 1 : -1;
    }
    return 0;
  }  
  

  loader.versions = loader.versions || {};

  var loaderNormalize = loader.normalize;
  loader.normalize = function(name, parentName, parentAddress) {
    if (!loader.versions)
      loader.versions = {};
    var packageVersions = this.versions;

    // strip the version before applying map config
    var stripVersion, stripSubPathLength;
    if (name.indexOf('@') > 0) {
      var versionIndex = name.lastIndexOf('@');
      var parts = name.substr(versionIndex + 1, name.length - versionIndex - 1).split('/');
      stripVersion = parts[0];
      stripSubPathLength = parts.length;
      name = name.substr(0, versionIndex) + name.substr(versionIndex + stripVersion.length + 1, name.length - versionIndex - stripVersion.length - 1);
    }

    // run all other normalizers first
    return Promise.resolve(loaderNormalize.call(this, name, parentName, parentAddress)).then(function(normalized) {
      
      var version, semverMatch, nextChar, versions;
      var index = normalized.indexOf('@');

      // if we stripped a version, and it still has no version, add it back
      if (stripVersion && (index == -1 || index == 0)) {
        var parts = normalized.split('/');
        parts[parts.length - stripSubPathLength] += '@' + stripVersion;
        normalized = parts.join('/');
        index = normalized.indexOf('@');
      }

      // see if this module corresponds to a package already in our versioned packages list
      
      // no version specified - check against the list (given we don't know the package name)
      if (index == -1 || index == 0) {
        for (var p in packageVersions) {
          versions = packageVersions[p];
          if (normalized.substr(0, p.length) != p)
            continue;

          nextChar = normalized.substr(p.length, 1);

          if (nextChar && nextChar != '/')
            continue;

          // match -> take latest version
          return p + '@' + (typeof versions == 'string' ? versions : versions[versions.length - 1]) + normalized.substr(p.length);
        }
        return normalized;
      }

      // get the version info
      version = normalized.substr(index + 1).split('/')[0];
      var versionLength = version.length;

      var minVersion;
      if (version.substr(0, 1) == '^') {
        version = version.substr(1);
        minVersion = true;
      }

      semverMatch = version.match(semverRegEx);

      // if not a semver, we cant help
      if (!semverMatch)
        return normalized;

      // translate '^' in range to simpler range form
      if (minVersion) {
        // ^0 -> 0
        // ^1 -> 1
        if (!semverMatch[2])
          minVersion = false;
        
        if (!semverMatch[3]) {
          
          // ^1.1 -> ^1.1.0
          if (semverMatch[2] > 0)
            semverMatch[3] = '0';

          // ^0.1 -> 0.1
          // ^0.0 -> 0.0
          else
            minVersion = false;
        }
      }

      if (minVersion) {
        // >= 1.0.0
        if (semverMatch[1] > 0) {
          if (!semverMatch[2])
            version = semverMatch[1] + '.0.0';
          if (!semverMatch[3])
            version = semverMatch[1] + '.0';
          minVersion = version;
          semverMatch = [semverMatch[1]];
        }
        // >= 0.1.0
        else if (semverMatch[2] > 0) {
          minVersion = version;
          semverMatch = [0, semverMatch[2]];
        }
        // >= 0.0.0
        else {
          // NB compatible with prerelease is just prelease itself?
          minVersion = false;
          semverMatch = [0, 0, semverMatch[3]];
        }
        version = semverMatch.join('.');
      }

      var packageName = normalized.substr(0, index);

      versions = packageVersions[packageName] || [];

      if (typeof versions == 'string')
        versions = [versions];

      // look for a version match
      // if an exact semver, theres nothing to match, just record it
      if (!semverMatch[3] || minVersion)
        for (var i = versions.length - 1; i >= 0; i--) {
          var curVersion = versions[i];
          // if I have requested x.y, find an x.y.z-b
          // if I have requested x, find any x.y / x.y.z-b
          if (curVersion.substr(0, version.length) == version && curVersion.substr(version.length, 1).match(/^[\.\-]?$/)) {
            // if a minimum version, then check too
            if (!minVersion || minVersion && semverCompare(curVersion, minVersion) != -1)
              return packageName + '@' + curVersion + normalized.substr(packageName.length + versionLength + 1);
          }
        }

      // no match
      // record the package and semver for reuse since we're now asking the server
      // x.y and x versions will now be latest by default, so they are useful in the version list
      if (indexOf.call(versions, version) == -1) {
        versions.push(version);
        versions.sort(semverCompare);

        normalized = packageName + '@' + version + normalized.substr(packageName.length + versionLength + 1);

        // if this is an x.y.z, remove any x.y, x
        // if this is an x.y, remove any x
        if (semverMatch[3] && (index = indexOf.call(versions, semverMatch[1] + '.' + semverMatch[2])) != -1)
          versions.splice(index, 1);
        if (semverMatch[2] && (index = indexOf.call(versions, semverMatch[1])) != -1)
          versions.splice(index, 1);

        packageVersions[packageName] = versions.length == 1 ? versions[0] : versions;
      }

      return normalized;
    });
  }
}
/*
 * Dependency Tree Cache
 * 
 * Allows a build to pre-populate a dependency trace tree on the loader of 
 * the expected dependency tree, to be loaded upfront when requesting the
 * module, avoinding the n round trips latency of module loading, where 
 * n is the dependency tree depth.
 *
 * eg:
 * System.depCache = {
 *  'app': ['normalized', 'deps'],
 *  'normalized': ['another'],
 *  'deps': ['tree']
 * };
 * 
 * System.import('app') 
 * // simultaneously starts loading all of:
 * // 'normalized', 'deps', 'another', 'tree'
 * // before "app" source is even loaded
 */

function depCache(loader) {
  loader.depCache = loader.depCache || {};

  loaderLocate = loader.locate;
  loader.locate = function(load) {
    var loader = this;

    if (!loader.depCache)
      loader.depCache = {};

    // load direct deps, in turn will pick up their trace trees
    var deps = loader.depCache[load.name];
    if (deps)
      for (var i = 0; i < deps.length; i++)
        loader.load(deps[i]);

    return loaderLocate.call(loader, load);
  }
}
  
  meta(System);
  register(System);
  core(System);
  global(System);
  cjs(System);
  amd(System);
  map(System);
  plugins(System);
  bundles(System);
  versions(System);
  depCache(System);

  
  if (!System.paths['@traceur'])
    System.paths['@traceur'] = __$curScript && __$curScript.getAttribute('data-traceur-src')
      || (__$curScript && __$curScript.src 
        ? __$curScript.src.substr(0, __$curScript.src.lastIndexOf('/') + 1) 
        : System.baseURL + (System.baseURL.lastIndexOf('/') == System.baseURL.length - 1 ? '' : '/')
        ) + 'traceur.js';

  return System;
};

function __eval(__source, __global, __address, __sourceMap) {
  try {
    __source = (__global != __$global ? 'with(__global) { (function() { ' + __source + ' \n }).call(__global); }' : __source)
      + '\n//# sourceURL=' + __address
      + (__sourceMap ? '\n//# sourceMappingURL=' + __sourceMap : '');
    eval(__source);
  }
  catch(e) {
    if (e.name == 'SyntaxError')
      e.message = 'Evaluating ' + __address + '\n\t' + e.message;
    if (System.trace && System.execute == false)
      console.log('Execution error for ' + __address + ': ' + e.stack || e);
    throw e;
  }
}

var __$curScript;

(function(global) {
  global.upgradeSystemLoader = function() {
    global.upgradeSystemLoader = undefined;
    var originalSystem = global.System;
    global.System = __upgradeSystemLoader(global.System);
    global.System.clone = function() {
      return __upgradeSystemLoader(originalSystem);
    };
  };

  if (typeof window != 'undefined') {
    var scripts = document.getElementsByTagName('script');
    __$curScript = scripts[scripts.length - 1];

    if (!global.System || !global.LoaderPolyfill) {
      // determine the current script path as the base path
      var curPath = __$curScript.src;
      var basePath = curPath.substr(0, curPath.lastIndexOf('/') + 1);
      document.write(
        '<' + 'script type="text/javascript" src="' + basePath + 'es6-module-loader.js" data-init="upgradeSystemLoader">' + '<' + '/script>'
      );
    }
    else {
      global.upgradeSystemLoader();
    }
  }
  else {
    var es6ModuleLoader = require('es6-module-loader');
    global.System = es6ModuleLoader.System;
    global.Loader = es6ModuleLoader.Loader;
    global.Module = es6ModuleLoader.Module;
    global.upgradeSystemLoader();
    module.exports = global.System;
  }
})(__$global);

})(typeof window != 'undefined' ? window : global);

(function(global){

	// helpers
	var camelize = function(str){
		return str.replace(/-+(.)?/g, function(match, chr){ 
			return chr ? chr.toUpperCase() : '' 
		});
	},
		each = function( o, cb){
			var i, len;

			// weak array detection, but we only use this internally so don't
			// pass it weird stuff
			if ( typeof o.length == 'number' && (o.length - 1) in o) {
				for ( i = 0, len = o.length; i < len; i++ ) {
					cb.call(o[i], o[i], i, o);
				}
			} else {
				for ( i in o ) {
					if(o.hasOwnProperty(i)){
						cb.call(o[i], o[i], i, o);
					}
				}
			}
			return o;
		},
		map = function(o, cb) {
			var arr = [];
			each(o, function(item, i){
				arr[i] = cb(item, i);
			});
			return arr;
		},
		isString = function(o) {
			return typeof o == "string";
		},
		extend = function(d,s){
			each(s, function(v, p){
				d[p] = v;
			});
			return d;
		},
		dir = function(uri){
			var lastSlash = uri.lastIndexOf("/");
			if(lastSlash !== -1) {
				return uri.substr(0, lastSlash);
			} else {
				return uri;
			}
		},
		last = function(arr){
			return arr[arr.length - 1];
		},
		parseURI = function(url) {
			var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
				// authority = '//' + user + ':' + pass '@' + hostname + ':' port
				return (m ? {
				href     : m[0] || '',
				protocol : m[1] || '',
				authority: m[2] || '',
				host     : m[3] || '',
				hostname : m[4] || '',
				port     : m[5] || '',
				pathname : m[6] || '',
				search   : m[7] || '',
				hash     : m[8] || ''
			} : null);
		},
		  
		joinURIs = function(base, href) {
			function removeDotSegments(input) {
				var output = [];
				input.replace(/^(\.\.?(\/|$))+/, '')
					.replace(/\/(\.(\/|$))+/g, '/')
					.replace(/\/\.\.$/, '/../')
					.replace(/\/?[^\/]*/g, function (p) {
						if (p === '/..') {
							output.pop();
						} else {
							output.push(p);
						}
					});
				return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
			}

			href = parseURI(href || '');
			base = parseURI(base || '');

			return !href || !base ? null : (href.protocol || base.protocol) +
				(href.protocol || href.authority ? href.authority : base.authority) +
				removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
					(href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
					href.hash;
		};


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

var makeSteal = function(System){
	
	var configDeferred,
		devDeferred,
		appDeferred;

	var steal = function(){
		var args = arguments;
		var afterConfig = function(){
			var imports = [];
			var factory;
			each(args, function(arg){
				if(isString(arg)) {
					imports.push( steal.System['import']( normalize(arg) ) );
				} else if(typeof arg === "function") {
					factory = arg;
				}
			});
			
			var modules = Promise.all(imports);
			if(factory) {
				return modules.then(function(modules) {
			        return factory && factory.apply(null, modules);
			   });
			} else {
				return modules;
			}
		};
		if(steal.config().env === "production") {
			return afterConfig();
		} else {
			// wait until the config has loaded
			return configDeferred.then(afterConfig,afterConfig);
		}
		
	};
	
	steal.System = System;
	steal.parseURI = parseURI;
	steal.joinURIs = joinURIs;
	steal.normalize = normalize;

	// System.ext = {bar: "path/to/bar"}
	// foo.bar! -> foo.bar!path/to/bar
	var addExt = function(loader) {
		
		loader.ext = {};
		
		var normalize = loader.normalize,
			endingExtension = /\.(\w+)!$/;
			
		loader.normalize = function(name, parentName, parentAddress){
			var matches = name.match(endingExtension),
				ext;
			
			if(matches && loader.ext[ext = matches[1]]) {
				name = name + loader.ext[ext];
			}
			return normalize.call(this, name, parentName, parentAddress);
		};
	};

	if(typeof System){
		addExt(System);
	}
	


	// "path/to/folder/" -> "path/to/folder/folder"
	var addForwardSlash = function(loader) {
		var normalize = loader.normalize;

		loader.normalize = function(name, parentName, parentAddress) {
			var lastPos = name.length - 1,
				secondToLast,
				folderName;

			if (name[lastPos] === "/") {
				secondToLast = name.substring(0, lastPos).lastIndexOf("/");
				folderName = name.substring(secondToLast + 1, lastPos);
				name += folderName;
			}
			return normalize.call(this, name, parentName, parentAddress);
		};
	};

	if (typeof System) {
		addForwardSlash(System);
	}

	var configData = {
		env: "development"
	};
	
	steal.config = function(data, value){
		if(isString(data)) {
			var name = data;
			if(arguments.length >= 2) {
				
			} else {
				
				var special = configSpecial[name];
				if(special && special.get) {
					return special.get();
				} else {
					return configData[name];
				}
			}
		} else if(typeof data === "object") {
			data = extend({},data);
			each(configSpecial, function(special, name){
				if(special.set && data[name]){
					var res = special.set(data[name]);
					if(res !== undefined) {
						configData[name] = res;
					} 
					delete data[name];
					
				}
			});
			
			extend(configData, data);
			
		} else {
			var config = {};
			
			each(configSpecial, function(special, name){
				if(special.get){
					config[name] = special.get();
				}
			});
			return extend(config, configData);	
		}
	};

var getSetToSystem = function(prop){
	return {
		get: function(){
			return steal.System[prop];
		},
		set: function(val){
			if(typeof val === "object" && typeof steal.System[prop] === "object") {
				steal.System[prop] = extend(steal.System[prop] || {},val || {});
			} else {
				steal.System[prop] = val;
			}
		}
	};
};

var configSpecial = {
	env: {
		set: function(val){
			addProductionBundles();
			return val;
		}
	},
	baseUrl: getSetToSystem("baseURL"),
	root: getSetToSystem("baseURL"),
	config: {
		set: function(val){
			var name = filename(val),
				root = dir(val);
			System.paths["stealconfig"] = name;
			configSpecial.root.set( (root === val ? "." : root)  +"/");
		}
	},
	paths: getSetToSystem("paths"),
	map: getSetToSystem("map"),
	startId: {
		set: function(val){
			configSpecial.main.set(  normalize(val) );
		},
		get: function(){
			return System.main;
		}
	},
	main: {
		get: getSetToSystem("main").get,
		set: function(val){
			System.main = val;
			addProductionBundles();
		}
	},
	meta: getSetToSystem("meta"),
	ext: getSetToSystem("ext")
};

var addProductionBundles = function(){
	if(configData.env === "production" && System.main) {
		var main = System.main,
			bundlesDir = System.bundlesPath || "bundles/",
			bundleName = bundlesDir+filename(main);

		System.meta[bundleName] = {format:"amd"};
		System.bundles[bundleName] = [main];
	}
};

	var LESS_ENGINE = "less-1.7.0";
	var getScriptOptions = function () {

		var options = {},
			parts, src, query, startFile, env,
			scripts = document.getElementsByTagName("script");

		var script = scripts[scripts.length - 1];

		if (script) {

			// Split on question mark to get query
			parts = script.src.split("?");
			src = parts.shift();

			query = parts.join("?");

			// Split on comma to get startFile and env
			parts = query.split(",");

			if (src.indexOf("steal.production") > -1) {
				options.env = "production";
			}

			// Grab startFile
			startFile = parts[0];

			if (startFile) {
				options.startId = startFile;
			}

			// Grab env
			env = parts[1];

			if (env) {
				options.env = env;
			}

			// Split on / to get rootUrl
			parts = src.split("/");
			var lastPart = parts.pop();

			if(lastPart.indexOf("steal") === 0 && !System.paths["steal/dev"]) {
				options.paths = {
					"steal/*": parts.join("/")+"/*.js",
					"less" :  parts.join("/")+"/"+LESS_ENGINE+".js",
					"@traceur": parts.slice(0,-1).join("/")+"/traceur/traceur.js",
				};
			}

			if ( last(parts) === "steal" ) {
				parts.pop();
				if ( last(parts) === "bower_components" ) {
					parts.pop();
				}
			}

			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						attr.nodeName.replace("data-","") :
						attr.nodeName );
				options[optionName] = attr.value;
			});
			if(!options.root && !options.baseUrl){
				options.root = parts.join("/")+"/";
			}

			// Set the bundles paths if in production
			if(options.env === "production") {
				var paths = options.paths = options.paths || {};
				var bundlesCSS = "bundles/*.css";
				var bundlesJS = "bundles/*";
				if(!paths[bundlesCSS]) {
					paths[bundlesCSS] = "dist/bundles/*css";
				}
				if(!paths[bundlesJS]) {
					paths[bundlesJS] = "dist/bundles/*.js";
				}
			}
		}

		return options;
	};

	var getOptionsFromStealLocation = function(){
		var options = {};
		if(typeof __dirname === "string" && !System.paths["steal/dev"]) {
			options.paths = {
				"steal/*": __dirname+"/*.js",
				"@traceur": __dirname.split("/").slice(0,-1).join("/")+"/traceur/traceur.js"
			};
		}

		System.register("less",[], function(){
			var r = require;
			return { __useDefault: true, 'default': r('less') };
		});
		return options;
	};

	steal.startup = function(config){

		// get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			var urlOptions = getOptionsFromStealLocation();
		}

		extend(System.ext,{
			css: 'steal/css',
			less: 'steal/less'
		});

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		steal.config(urlOptions);
		if(config){
			steal.config(config);
		}


		var options = steal.config();
		// Read the env now because we can't overwrite everything yet

		// mark things that have already been loaded
		each(options.executed || [], function( i, stel ) {
			System.register(stel,[],function(){});
		});

		// immediate steals we do
		var steals = [];

		// add start files first
		if ( options.startIds ) {
			/// this can be a string or an array
			steals.push.apply(steals, isString(options.startIds) ? [options.startIds] : options.startIds);
			options.startIds = steals.slice(0);
		}

		// we only load things with force = true
		if ( options.env == "production" && steal.System.main ) {

			return appDeferred = steal.System.import(steal.System.main)["catch"](function(e){
				console.log(e);
			});

		} else if(options.env == "development"){

			configDeferred = steal.System.import("stealconfig");

			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
				// what was loaded in stealconfig.js
				// This means we call it twice, but that's ok
				if(config) {
					steal.config(config);
				}

				return steal.System.import("steal/dev");
			},function(e){
				console.log("steal - error loading stealconfig.",e);
				return steal.System.import("steal/dev");
			});

			appDeferred = devDeferred.then(function(){

				// if there's a main, get it, otherwise, we are just loading
				// the config.
				return steal.System.main ? 
					System.import(steal.System.main):
					configDeferred;
			}).then(function(){
				if(steal.dev) {
					steal.dev.log("app loaded successfully")
				}
			}, function(error){
				console.log("error",error,  error.stack);
			});
			return appDeferred;
		}
	};

	return steal;


};
/*
  SystemJS Steal Format
  Provides the Steal module format definition.
*/
function addSteal(loader) {

  // Steal Module Format Detection RegEx
  // steal(module, ...)
  var stealRegEx = /(?:^\s*|[}{\(\);,\n\?\&]\s*)steal\s*\(\s*((?:"[^"]+"\s*,|'[^']+'\s*,\s*)*)/;

  // What we stole.
  var stealInstantiateResult;
  
  function createSteal(loader) {
    stealInstantiateResult = null;

    // ensure no NodeJS environment detection
    loader.global.module = undefined;
    loader.global.exports = undefined;

    function steal() {
      var deps = [];
      var factory;
      
      for( var i = 0; i < arguments.length; i++ ) {
        if (typeof arguments[i] === 'string') {
          deps.push( normalize(arguments[i]) );
        } else {
          factory = arguments[i];
        }
      }

      if (typeof factory !== 'function') {
        factory = (function(factory) {
          return function() { return factory; };
        })(factory);
      }

      stealInstantiateResult = {
        deps: deps,
        execute: function(require, exports, moduleName) {

          var depValues = [];
          for (var i = 0; i < deps.length; i++) {
            depValues.push(require(deps[i]));
          }

          var output = factory.apply(loader.global, depValues);

          if (typeof output !== 'undefined') {
            return output;
          }
        }
      };
    }

    loader.global.steal = steal;
  }

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;

    if (load.metadata.format === 'steal' || !load.metadata.format && load.source.match(stealRegEx)) {
      load.metadata.format = 'steal';

      var oldSteal = loader.global.steal;

      createSteal(loader);

      loader.__exec(load);

      loader.global.steal = oldSteal;

      if (!stealInstantiateResult) {
        throw "Steal module " + load.name + " did not call steal";
      }

      if (stealInstantiateResult) {
        load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(stealInstantiateResult.deps) : stealInstantiateResult.deps;
        load.metadata.execute = stealInstantiateResult.execute;
      }
    }
    return loaderInstantiate.call(loader, load);
  };

  return loader;
}

if (typeof System !== "undefined") {
  addSteal(System);
}

	
	if (typeof window != 'undefined') {
		var oldSteal = window.steal;
		window.steal = makeSteal(System);
		window.steal.startup(oldSteal && typeof oldSteal == 'object' && oldSteal  );
		window.steal.addSteal = addSteal;
		
	} else {
    	
		require('systemjs');
			
		global.steal = makeSteal(System);
		global.steal.System = System;
		global.steal.dev = require("./dev.js");
		steal.clone = makeSteal;
		module.exports = global.steal;
		global.steal.addSteal = addSteal;
	}
    
    
})(typeof window == "undefined" ? global : window);