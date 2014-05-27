!function(){ return typeof Promise != 'undefined' && Promise.all && Promise.resolve && Promise.reject; }() &&
!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Promise=e():"undefined"!=typeof global?global.Promise=e():"undefined"!=typeof self&&(self.Promise=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * ES6 global Promise shim
 */
var PromiseConstructor = module.exports = require('../lib/Promise');

var g = typeof global !== 'undefined' && global
  || typeof window !== 'undefined' && window
  || typeof self !== 'undefined' && self;

if(typeof g !== 'undefined' && typeof g.Promise === 'undefined') {
  g.Promise = PromiseConstructor;
}

},{"../lib/Promise":2}],2:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function (require) {

  var makePromise = require('./makePromise');
  var Scheduler = require('./scheduler');
  var async = require('./async');

  return makePromise({
    scheduler: new Scheduler(async),
    monitor: typeof console !== 'undefined' ? console : void 0
  });

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });

},{"./async":4,"./makePromise":5,"./scheduler":6}],3:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {
  /**
   * Circular queue
   * @param {number} capacityPow2 power of 2 to which this queue's capacity
   *  will be set initially. eg when capacityPow2 == 3, queue capacity
   *  will be 8.
   * @constructor
   */
  function Queue(capacityPow2) {
    this.head = this.tail = this.length = 0;
    this.buffer = new Array(1 << capacityPow2);
  }

  Queue.prototype.push = function(x) {
    if(this.length === this.buffer.length) {
      this._ensureCapacity(this.length * 2);
    }

    this.buffer[this.tail] = x;
    this.tail = (this.tail + 1) & (this.buffer.length - 1);
    ++this.length;
    return this.length;
  };

  Queue.prototype.shift = function() {
    var x = this.buffer[this.head];
    this.buffer[this.head] = void 0;
    this.head = (this.head + 1) & (this.buffer.length - 1);
    --this.length;
    return x;
  };

  Queue.prototype._ensureCapacity = function(capacity) {
    var head = this.head;
    var buffer = this.buffer;
    var newBuffer = new Array(capacity);
    var i = 0;
    var len;

    if(head === 0) {
      len = this.length;
      for(; i<len; ++i) {
        newBuffer[i] = buffer[i];
      }
    } else {
      capacity = buffer.length;
      len = this.tail;
      for(; head<capacity; ++i, ++head) {
        newBuffer[i] = buffer[head];
      }

      for(head=0; head<len; ++i, ++head) {
        newBuffer[i] = buffer[head];
      }
    }

    this.buffer = newBuffer;
    this.head = 0;
    this.tail = this.length;
  };

  return Queue;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

},{}],4:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

  // Sniff "best" async scheduling option
  // Prefer process.nextTick or MutationObserver, then check for
  // vertx and finally fall back to setTimeout

  /*jshint maxcomplexity:6*/
  /*global process,document,setTimeout,MutationObserver,WebKitMutationObserver*/
  var nextTick, MutationObs;

  if (typeof process !== 'undefined' && process !== null &&
    typeof process.nextTick === 'function') {
    nextTick = function(f) {
      process.nextTick(f);
    };

  } else if (MutationObs =
    (typeof MutationObserver === 'function' && MutationObserver) ||
    (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
    nextTick = (function (document, MutationObserver) {
      var scheduled;
      var el = document.createElement('div');
      var o = new MutationObserver(run);
      o.observe(el, { attributes: true });

      function run() {
        var f = scheduled;
        scheduled = void 0;
        f();
      }

      return function (f) {
        scheduled = f;
        el.setAttribute('class', 'x');
      };
    }(document, MutationObs));

  } else {
    nextTick = (function(cjsRequire) {
      try {
        // vert.x 1.x || 2.x
        return cjsRequire('vertx').runOnLoop || cjsRequire('vertx').runOnContext;
      } catch (ignore) {}

      // capture setTimeout to avoid being caught by fake timers
      // used in time based tests
      var capturedSetTimeout = setTimeout;
      return function (t) {
        capturedSetTimeout(t, 0);
      };
    }(require));
  }

  return nextTick;
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

},{}],5:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

  return function makePromise(environment) {

    var foreverPendingPromise;
    var tasks = environment.scheduler;

    var objectCreate = Object.create ||
      function(proto) {
        function Child() {}
        Child.prototype = proto;
        return new Child();
      };

    /**
     * Create a promise whose fate is determined by resolver
     * @constructor
     * @returns {Promise} promise
     * @name Promise
     */
    function Promise(resolver) {
      var self = this;
      this._handler = new DeferredHandler();

      runResolver(resolver, promiseResolve, promiseReject, promiseNotify);

      /**
       * Transition from pre-resolution state to post-resolution state, notifying
       * all listeners of the ultimate fulfillment or rejection
       * @param {*} x resolution value
       */
      function promiseResolve (x) {
        self._handler.resolve(x);
      }
      /**
       * Reject this promise with reason, which will be used verbatim
       * @param {*} reason reason for the rejection, typically an Error
       */
      function promiseReject (reason) {
        self._handler.reject(reason);
      }

      /**
       * Issue a progress event, notifying all progress listeners
       * @param {*} x progress event payload to pass to all listeners
       */
      function promiseNotify (x) {
        self._handler.notify(x);
      }
    }

    function runResolver(resolver, promiseResolve, promiseReject, promiseNotify) {
      try {
        resolver(promiseResolve, promiseReject, promiseNotify);
      } catch (e) {
        promiseReject(e);
      }
    }

    // Creation

    Promise.resolve = resolve;
    Promise.reject = reject;
    Promise.never = never;

    Promise._defer = defer;

    /**
     * Returns a trusted promise. If x is already a trusted promise, it is
     * returned, otherwise returns a new trusted Promise which follows x.
     * @param  {*} x
     * @return {Promise} promise
     */
    function resolve(x) {
      return x instanceof Promise ? x
        : new InternalPromise(new AsyncHandler(getHandler(x)));
    }

    /**
     * Return a reject promise with x as its reason (x is used verbatim)
     * @param {*} x
     * @returns {Promise} rejected promise
     */
    function reject(x) {
      return new InternalPromise(new AsyncHandler(new RejectedHandler(x)));
    }

    /**
     * Return a promise that remains pending forever
     * @returns {Promise} forever-pending promise.
     */
    function never() {
      return foreverPendingPromise; // Should be frozen
    }

    /**
     * Creates an internal {promise, resolver} pair
     * @private
     * @returns {{resolver: DeferredHandler, promise: InternalPromise}}
     */
    function defer() {
      return new InternalPromise(new DeferredHandler());
    }

    // Transformation and flow control

    /**
     * Transform this promise's fulfillment value, returning a new Promise
     * for the transformed result.  If the promise cannot be fulfilled, onRejected
     * is called with the reason.  onProgress *may* be called with updates toward
     * this promise's fulfillment.
     * @param [onFulfilled] {Function} fulfillment handler
     * @param [onRejected] {Function} rejection handler
     * @param [onProgress] {Function} progress handler
     * @return {Promise} new promise
     */
    Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
      var from = this._handler;
      var to = new DeferredHandler(from.receiver);
      from.when(to.resolve, to.notify, to, from.receiver, onFulfilled, onRejected, onProgress);

      return new InternalPromise(to);
    };

    /**
     * If this promise cannot be fulfilled due to an error, call onRejected to
     * handle the error. Shortcut for .then(undefined, onRejected)
     * @param {function?} onRejected
     * @return {Promise}
     */
    Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
      return this.then(void 0, onRejected);
    };

    /**
     * Private function to bind a thisArg for this promise's handlers
     * @private
     * @param {object} thisArg `this` value for all handlers attached to
     *  the returned promise.
     * @returns {Promise}
     */
    Promise.prototype._bindContext = function(thisArg) {
      return new InternalPromise(new BoundHandler(this._handler, thisArg));
    };

    // Array combinators

    Promise.all = all;
    Promise.race = race;

    /**
     * Return a promise that will fulfill when all promises in the
     * input array have fulfilled, or will reject when one of the
     * promises rejects.
     * @param {array} promises array of promises
     * @returns {Promise} promise for array of fulfillment values
     */
    function all(promises) {
      /*jshint maxcomplexity:6*/
      var resolver = new DeferredHandler();
      var len = promises.length >>> 0;
      var pending = len;
      var results = [];
      var i, x;

      for (i = 0; i < len; ++i) {
        if (i in promises) {
          x = promises[i];
          if (maybeThenable(x)) {
            resolveOne(resolver, results, getHandlerThenable(x), i);
          } else {
            results[i] = x;
            --pending;
          }
        } else {
          --pending;
        }
      }

      if(pending === 0) {
        resolver.resolve(results);
      }

      return new InternalPromise(resolver);

      function resolveOne(resolver, results, handler, i) {
        handler.when(noop, noop, void 0, resolver, function(x) {
          results[i] = x;
          if(--pending === 0) {
            this.resolve(results);
          }
        }, resolver.reject, resolver.notify);
      }
    }

    /**
     * Fulfill-reject competitive race. Return a promise that will settle
     * to the same state as the earliest input promise to settle.
     *
     * WARNING: The ES6 Promise spec requires that race()ing an empty array
     * must return a promise that is pending forever.  This implementation
     * returns a singleton forever-pending promise, the same singleton that is
     * returned by Promise.never(), thus can be checked with ===
     *
     * @param {array} promises array of promises to race
     * @returns {Promise} if input is non-empty, a promise that will settle
     * to the same outcome as the earliest input promise to settle. if empty
     * is empty, returns a promise that will never settle.
     */
    function race(promises) {
      // Sigh, race([]) is untestable unless we return *something*
      // that is recognizable without calling .then() on it.
      if(Object(promises) === promises && promises.length === 0) {
        return never();
      }

      var h = new DeferredHandler();
      for(var i=0; i<promises.length; ++i) {
        getHandler(promises[i]).when(noop, noop, void 0, h, h.resolve, h.reject);
      }

      return new InternalPromise(h);
    }

    // Promise internals

    /**
     * InternalPromise represents a promise that is either already
     * fulfilled or reject, or is following another promise, based
     * on the provided handler.
     * @private
     * @param {object} handler
     * @constructor
     */
    function InternalPromise(handler) {
      this._handler = handler;
    }

    InternalPromise.prototype = objectCreate(Promise.prototype);

    /**
     * Get an appropriate handler for x, checking for untrusted thenables
     * and promise graph cycles.
     * @private
     * @param {*} x
     * @param {object?} h optional handler to check for cycles
     * @returns {object} handler
     */
    function getHandler(x, h) {
      if(x instanceof Promise) {
        return getHandlerChecked(x, h);
      }
      return maybeThenable(x) ? getHandlerUntrusted(x) : new FulfilledHandler(x);
    }

    /**
     * Get an appropriate handler for x, which must be either a thenable
     * @param {object} x
     * @returns {object} handler
     */
    function getHandlerThenable(x) {
      return x instanceof Promise ? x._handler.join() : getHandlerUntrusted(x);
    }

    /**
     * Get x's handler, checking for cycles
     * @param {Promise} x
     * @param {object?} h handler to check for cycles
     * @returns {object} handler
     */
    function getHandlerChecked(x, h) {
      var xh = x._handler.join();
      return h === xh ? promiseCycleHandler() : xh;
    }

    /**
     * Get a handler for potentially untrusted thenable x
     * @param {*} x
     * @returns {object} handler
     */
    function getHandlerUntrusted(x) {
      try {
        var untrustedThen = x.then;
        return typeof untrustedThen === 'function'
          ? new ThenableHandler(untrustedThen, x)
          : new FulfilledHandler(x);
      } catch(e) {
        return new RejectedHandler(e);
      }
    }

    /**
     * Handler for a promise that is pending forever
     * @private
     * @constructor
     */
    function Handler() {}

    Handler.prototype.inspect = toPendingState;
    Handler.prototype.when = noop;
    Handler.prototype.resolve = noop;
    Handler.prototype.reject = noop;
    Handler.prototype.notify = noop;
    Handler.prototype.join = function() { return this; };

    Handler.prototype._env = environment.monitor || Promise;
    Handler.prototype._addTrace = noop;
    Handler.prototype._isMonitored = function() {
      return typeof this._env.promiseMonitor !== 'undefined';
    };

    /**
     * Abstract base for handler that delegates to another handler
     * @private
     * @param {object} handler
     * @constructor
     */
    function DelegateHandler(handler) {
      this.handler = handler;
      if(this._isMonitored()) {
        var trace = this._env.promiseMonitor.captureStack();
        this.trace = handler._addTrace(trace);
      }
    }

    DelegateHandler.prototype = objectCreate(Handler.prototype);

    DelegateHandler.prototype.join = function() {
      return this.handler.join();
    };

    DelegateHandler.prototype.inspect = function() {
      return this.handler.inspect();
    };

    DelegateHandler.prototype._addTrace = function(trace) {
      return this.handler._addTrace(trace);
    };

    /**
     * Handler that manages a queue of consumers waiting on a pending promise
     * @private
     * @constructor
     */
    function DeferredHandler(receiver) {
      this.consumers = [];
      this.receiver = receiver;
      this.handler = void 0;
      this.resolved = false;
      if(this._isMonitored()) {
        this.trace = this._env.promiseMonitor.captureStack();
      }
    }

    DeferredHandler.prototype = objectCreate(Handler.prototype);

    DeferredHandler.prototype.inspect = function() {
      return this.resolved ? this.handler.join().inspect() : toPendingState();
    };

    DeferredHandler.prototype.resolve = function(x) {
      this._join(getHandler(x, this));
    };

    DeferredHandler.prototype.reject = function(x) {
      this._join(new RejectedHandler(x));
    };

    DeferredHandler.prototype.join = function() {
      return this.resolved ? this.handler.join() : this;
    };

    DeferredHandler.prototype.run = function() {
      var q = this.consumers;
      var handler = this.handler = this.handler.join();
      this.consumers = void 0;

      for (var i = 0; i < q.length; i+=7) {
        handler.when(q[i], q[i+1], q[i+2], q[i+3], q[i+4], q[i+5], q[i+6]);
      }
    };

    DeferredHandler.prototype._join = function(handler) {
      if(this.resolved) {
        return;
      }

      this.resolved = true;
      this.handler = handler;
      tasks.enqueue(this);

      if(this._isMonitored()) {
        this.trace = handler._addTrace(this.trace);
      }
    };

    DeferredHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
      if(this.resolved) {
        tasks.enqueue(new RunHandlerTask(resolve, notify, t, receiver, f, r, u, this.handler.join()));
      } else {
        this.consumers.push(resolve, notify, t, receiver, f, r, u);
      }
    };

    DeferredHandler.prototype.notify = function(x) {
      if(!this.resolved) {
        tasks.enqueue(new ProgressTask(this.consumers, x));
      }
    };

    DeferredHandler.prototype._addTrace = function(trace) {
      return this.resolved ? this.handler._addTrace(trace) : trace;
    };

    /**
     * Wrap another handler and force it into a future stack
     * @private
     * @param {object} handler
     * @constructor
     */
    function AsyncHandler(handler) {
      DelegateHandler.call(this, handler);
    }

    AsyncHandler.prototype = objectCreate(DelegateHandler.prototype);

    AsyncHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
      tasks.enqueue(new RunHandlerTask(resolve, notify, t, receiver, f, r, u, this.join()));
    };

    /**
     * Handler that follows another handler, injecting a receiver
     * @private
     * @param {object} handler another handler to follow
     * @param {object=undefined} receiver
     * @constructor
     */
    function BoundHandler(handler, receiver) {
      DelegateHandler.call(this, handler);
      this.receiver = receiver;
    }

    BoundHandler.prototype = objectCreate(DelegateHandler.prototype);

    BoundHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
      // Because handlers are allowed to be shared among promises,
      // each of which possibly having a different receiver, we have
      // to insert our own receiver into the chain if it has been set
      // so that callbacks (f, r, u) will be called using our receiver
      if(this.receiver !== void 0) {
        receiver = this.receiver;
      }
      this.join().when(resolve, notify, t, receiver, f, r, u);
    };

    /**
     * Handler that wraps an untrusted thenable and assimilates it in a future stack
     * @private
     * @param {function} then
     * @param {{then: function}} thenable
     * @constructor
     */
    function ThenableHandler(then, thenable) {
      DeferredHandler.call(this);
      this.assimilated = false;
      this.untrustedThen = then;
      this.thenable = thenable;
    }

    ThenableHandler.prototype = objectCreate(DeferredHandler.prototype);

    ThenableHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
      if(!this.assimilated) {
        this.assimilated = true;
        this._assimilate();
      }
      DeferredHandler.prototype.when.call(this, resolve, notify, t, receiver, f, r, u);
    };

    ThenableHandler.prototype._assimilate = function() {
      var h = this;
      this._try(this.untrustedThen, this.thenable, _resolve, _reject, _notify);

      function _resolve(x) { h.resolve(x); }
      function _reject(x)  { h.reject(x); }
      function _notify(x)  { h.notify(x); }
    };

    ThenableHandler.prototype._try = function(then, thenable, resolve, reject, notify) {
      try {
        then.call(thenable, resolve, reject, notify);
      } catch (e) {
        reject(e);
      }
    };

    /**
     * Handler for a fulfilled promise
     * @private
     * @param {*} x fulfillment value
     * @constructor
     */
    function FulfilledHandler(x) {
      this.value = x;
    }

    FulfilledHandler.prototype = objectCreate(Handler.prototype);

    FulfilledHandler.prototype.inspect = function() {
      return toFulfilledState(this.value);
    };

    FulfilledHandler.prototype.when = function(resolve, notify, t, receiver, f) {
      var x = typeof f === 'function'
        ? tryCatchReject(f, this.value, receiver)
        : this.value;

      resolve.call(t, x);
    };

    /**
     * Handler for a rejected promise
     * @private
     * @param {*} x rejection reason
     * @constructor
     */
    function RejectedHandler(x) {
      this.value = x;
      this.observed = false;

      if(this._isMonitored()) {
        this.key = this._env.promiseMonitor.startTrace(x);
      }
    }

    RejectedHandler.prototype = objectCreate(Handler.prototype);

    RejectedHandler.prototype.inspect = function() {
      return toRejectedState(this.value);
    };

    RejectedHandler.prototype.when = function(resolve, notify, t, receiver, f, r) {
      if(this._isMonitored() && !this.observed) {
        this._env.promiseMonitor.removeTrace(this.key);
      }

      this.observed = true;
      var x = typeof r === 'function'
        ? tryCatchReject(r, this.value, receiver)
        : reject(this.value);

      resolve.call(t, x);
    };

    RejectedHandler.prototype._addTrace = function(trace) {
      if(!this.observed) {
        this._env.promiseMonitor.updateTrace(this.key, trace);
      }
    };

    // Errors and singletons

    foreverPendingPromise = new InternalPromise(new Handler());

    function promiseCycleHandler() {
      return new RejectedHandler(new TypeError('Promise cycle'));
    }

    // Snapshot states

    /**
     * Creates a fulfilled state snapshot
     * @private
     * @param {*} x any value
     * @returns {{state:'fulfilled',value:*}}
     */
    function toFulfilledState(x) {
      return { state: 'fulfilled', value: x };
    }

    /**
     * Creates a rejected state snapshot
     * @private
     * @param {*} x any reason
     * @returns {{state:'rejected',reason:*}}
     */
    function toRejectedState(x) {
      return { state: 'rejected', reason: x };
    }

    /**
     * Creates a pending state snapshot
     * @private
     * @returns {{state:'pending'}}
     */
    function toPendingState() {
      return { state: 'pending' };
    }

    // Task runners

    /**
     * Run a single consumer
     * @private
     * @constructor
     */
    function RunHandlerTask(a, b, c, d, e, f, g, handler) {
      this.a=a;this.b=b;this.c=c;this.d=d;this.e=e;this.f=f;this.g=g;
      this.handler = handler;
    }

    RunHandlerTask.prototype.run = function() {
      this.handler.when(this.a, this.b, this.c, this.d, this.e, this.f, this.g);
    };

    /**
     * Run a queue of progress handlers
     * @private
     * @constructor
     */
    function ProgressTask(q, value) {
      this.q = q;
      this.value = value;
    }

    ProgressTask.prototype.run = function() {
      var q = this.q;
      // First progress handler is at index 1
      for (var i = 1; i < q.length; i+=7) {
        this._notify(q[i], q[i+1], q[i+2], q[i+5]);
      }
    };

    ProgressTask.prototype._notify = function(notify, t, receiver, u) {
      var x = typeof u === 'function'
        ? tryCatchReturn(u, this.value, receiver)
        : this.value;

      notify.call(t, x);
    };

    /**
     * @param {*} x
     * @returns {boolean} false iff x is guaranteed not to be a thenable
     */
    function maybeThenable(x) {
      return (typeof x === 'object' || typeof x === 'function') && x !== null;
    }

    /**
     * Return f.call(thisArg, x), or if it throws return a rejected promise for
     * the thrown exception
     * @private
     */
    function tryCatchReject(f, x, thisArg) {
      try {
        return f.call(thisArg, x);
      } catch(e) {
        return reject(e);
      }
    }

    /**
     * Return f.call(thisArg, x), or if it throws, *return* the exception
     * @private
     */
    function tryCatchReturn(f, x, thisArg) {
      try {
        return f.call(thisArg, x);
      } catch(e) {
        return e;
      }
    }

    function noop() {}

    return Promise;
  };
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

},{}],6:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

  var Queue = require('./Queue');

  // Credit to Twisol (https://github.com/Twisol) for suggesting
  // this type of extensible queue + trampoline approach for next-tick conflation.

  function Scheduler(enqueue) {
    this._enqueue = enqueue;
    this._handlerQueue = new Queue(15);

    var self = this;
    this.drainQueue = function() {
      self._drainQueue();
    };
  }

  /**
   * Enqueue a task. If the queue is not currently scheduled to be
   * drained, schedule it.
   * @param {function} task
   */
  Scheduler.prototype.enqueue = function(task) {
    if(this._handlerQueue.push(task) === 1) {
      this._enqueue(this.drainQueue);
    }
  };

  /**
   * Drain the handler queue entirely, being careful to allow the
   * queue to be extended while it is being processed, and to continue
   * processing until it is truly empty.
   */
  Scheduler.prototype._drainQueue = function() {
    var q = this._handlerQueue;
    while(q.length > 0) {
      q.shift().run();
    }
  };

  return Scheduler;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

},{"./Queue":3}]},{},[1])
(1)
});
;
/*
*********************************************************************************************

  Loader Polyfill

    - Implemented exactly to the 2013-12-02 Specification Draft -
      https://github.com/jorendorff/js-loaders/blob/e60d3651/specs/es6-modules-2013-12-02.pdf
      with the only exceptions as described here

    - Abstract functions have been combined where possible, and their associated functions 
      commented

    - When the traceur global is detected, declarative modules are transformed by Traceur
      before execution. The Traceur parse tree is stored as load.body, analogously to the
      spec

    - Link and EnsureEvaluated have been customised from the spec

    - Module Linkage records are stored as: { module: (actual module), dependencies, body, name, address }

    - Cycles are not supported at all and will throw an error

    - Realm implementation is entirely omitted. As such, Loader.global and Loader.realm
      accessors will throw errors, as well as Loader.eval

    - Loader module table iteration currently not yet implemented

*********************************************************************************************
*/

// Some Helpers

// logs a linkset snapshot for debugging
/* function snapshot(loader) {
  console.log('\n');
  for (var i = 0; i < loader._loads.length; i++) {
    var load = loader._loads[i];
    var linkSetLog = load.name + ' (' + load.status + '): ';

    for (var j = 0; j < load.linkSets.length; j++) {
      linkSetLog += '{'
      linkSetLog += logloads(load.linkSets[j].loads);
      linkSetLog += '} ';
    }
    console.log(linkSetLog);
  }
  console.log('\n');
}
function logloads(loads) {
  var log = '';
  for (var k = 0; k < loads.length; k++)
    log += loads[k].name + (k != loads.length - 1 ? ' ' : '');
  return log;
} */

(function (global) {
  (function() {
    var Promise = global.Promise || require('./promise');

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

    // Load Abstract Functions

    function createLoad(name) {
      return {
        status: 'loading',
        name: name,
        metadata: {},
        linkSets: []
      };
    }

    // promise for a load record, can be in registry, already loading, or not
    function requestLoad(loader, request, referrerName, referrerAddress) {
      return new Promise(function(resolve, reject) {
        // CallNormalize
        resolve(loader.normalize(request, referrerName, referrerAddress));
      })

      // GetOrCreateLoad
      .then(function(name) {
        var load;
        if (loader._modules[name]) {
          load = createLoad(name);
          load.status = 'linked';
          return load;
        }

        for (var i = 0, l = loader._loads.length; i < l; i++) {
          load = loader._loads[i];
          if (load.name == name) {
            console.assert('loading or loaded', load.status == 'loading' || load.status == 'loaded');
            return load;
          }
        }

        // CreateLoad
        load = createLoad(name);
        loader._loads.push(load);

        proceedToLocate(loader, load);

        return load;
      });
    }
    function proceedToLocate(loader, load) {
      proceedToFetch(loader, load,
        Promise.resolve()
        // CallLocate
        .then(function() {
          return loader.locate({ name: load.name, metadata: load.metadata });
        })
      );
    }
    function proceedToFetch(loader, load, p) {
      proceedToTranslate(loader, load, 
        p
        // CallFetch
        .then(function(address) {
          if (load.status == 'failed') // NB https://github.com/jorendorff/js-loaders/issues/88
            return undefined;
          load.address = address;
          return loader.fetch({ name: load.name, metadata: load.metadata, address: address });
        })
      );
    }
    function proceedToTranslate(loader, load, p) {
      p
      // CallTranslate
      .then(function(source) {
        if (load.status == 'failed')
          return undefined;
        return loader.translate({ name: load.name, metadata: load.metadata, address: load.address, source: source })
      })

      // CallInstantiate
      .then(function(source) {
        if (load.status == 'failed')
          return undefined;
        load.source = source;
        return loader.instantiate({ name: load.name, metadata: load.metadata, address: load.address, source: source });
      })

      // InstantiateSucceeded
      .then(function(instantiateResult) {
        if (load.status == 'failed')
          return undefined;

        var depsList;
        if (instantiateResult === undefined) {
          if (global.traceur) {
            if (!traceur) {
              traceur = global.traceur;
              $traceurRuntime.ModuleStore.get = $traceurRuntime.getModuleImpl = function(name) {
                return System.get(name);
              }
            }
            load.address = load.address || 'anon' + ++anonCnt;
            var parser = new traceur.syntax.Parser(new traceur.syntax.SourceFile(load.address, load.source));
            load.body = parser.parseModule();
            depsList = getImports(load.body);
          }
          else {
            throw new TypeError('Include Traceur for module syntax support');
          }
          load.kind = 'declarative';
        }
        else if (typeof instantiateResult == 'object') {
          depsList = instantiateResult.deps || [];
          load.execute = instantiateResult.execute;
          load.kind = 'dynamic';
        }
        else
          throw TypeError('Invalid instantiate return value');

        // ProcessLoadDependencies
        load.dependencies = {};
        load.depsList = depsList;
        var loadPromises = [];
        for (var i = 0, l = depsList.length; i < l; i++) (function(request) {
          var p = requestLoad(loader, request, load.name, load.address);

          // AddDependencyLoad (load is parentLoad)
          p.then(function(depLoad) {
            console.assert('not already a dependency', !load.dependencies[request]);
            load.dependencies[request] = depLoad.name;

            if (depLoad.status != 'linked') {
              var linkSets = load.linkSets.concat([]);
              for (var i = 0, l = linkSets.length; i < l; i++)
                addLoadToLinkSet(linkSets[i], depLoad);
            }
          });

          loadPromises.push(p);
        })(depsList[i]);

        return Promise.all(loadPromises);
      })

      // LoadSucceeded
      .then(function() {
        console.assert('is loading', load.status == 'loading');

        load.status = 'loaded';

        // console.log('load succeeeded ' + load.name);
        // snapshot(loader);

        var linkSets = load.linkSets.concat([]);
        for (var i = 0, l = linkSets.length; i < l; i++)
          updateLinkSetOnLoad(linkSets[i], load);
      }

      // LoadFailed
      , function(exc) {
        console.assert('is loading on fail', load.status == 'loading');
        load.status = 'failed';
        load.exception = exc;
        for (var i = 0, l = load.linkSets.length; i < l; i++)
          linkSetFailed(load.linkSets[i], exc);
        console.assert('fail linkSets removed', load.linkSets.length == 0);
      });
    }


    // LinkSet Abstract Functions
    function createLinkSet(loader, startingLoad) {
      var resolve, reject, promise = new Promise(function(_resolve, _reject) { resolve = _resolve; reject = _reject; });
      var linkSet = {
        loader: loader,
        loads: [],
        done: promise,
        resolve: resolve,
        reject: reject,
        loadingCount: 0
      };
      addLoadToLinkSet(linkSet, startingLoad);
      return linkSet;
    }
    function addLoadToLinkSet(linkSet, load) {
      console.assert('loading or loaded on link set', load.status == 'loading' || load.status == 'loaded');

      for (var i = 0, l = linkSet.loads.length; i < l; i++)
        if (linkSet.loads[i] == load)
          return;

      linkSet.loads.push(load);
      load.linkSets.push(linkSet);

      if (load.status != 'loaded')
        linkSet.loadingCount++;

      var loader = linkSet.loader;

      for (var dep in load.dependencies) {
        var name = load.dependencies[dep];

        if (loader._modules[name])
          continue;

        for (var i = 0, l = loader._loads.length; i < l; i++)
          if (loader._loads[i].name == name) {
            addLoadToLinkSet(linkSet, loader._loads[i]);
            break;
          }
      }
      // console.log('add to linkset ' + load.name);
      // snapshot(linkSet.loader);
    }
    function updateLinkSetOnLoad(linkSet, load) {
      // NB https://github.com/jorendorff/js-loaders/issues/85
      // console.assert('no load when updated ' + load.name, indexOf.call(linkSet.loads, load) != -1);
      console.assert('loaded or linked', load.status == 'loaded' || load.status == 'linked');

      // console.log('update linkset on load ' + load.name);
      // snapshot(linkSet.loader);

      // see https://github.com/jorendorff/js-loaders/issues/80
      linkSet.loadingCount--;
      /* for (var i = 0; i < linkSet.loads.length; i++) {
        if (linkSet.loads[i].status == 'loading') {
          return;
        }
      } */

      if (linkSet.loadingCount > 0)
        return;

      var startingLoad = linkSet.loads[0];
      try {
        link(linkSet.loads, linkSet.loader);
      }
      catch(exc) {
        return linkSetFailed(linkSet, exc);
      }

      console.assert('loads cleared', linkSet.loads.length == 0);
      linkSet.resolve(startingLoad);
    }
    function linkSetFailed(linkSet, exc) {
      var loads = linkSet.loads.concat([]);
      for (var i = 0, l = loads.length; i < l; i++) {
        var load = loads[i];
        var linkIndex = indexOf.call(load.linkSets, linkSet);
        console.assert('link not present', linkIndex != -1);
        load.linkSets.splice(linkIndex, 1);
        if (load.linkSets.length == 0) {
          var globalLoadsIndex = indexOf.call(linkSet.loader._loads, load);
          if (globalLoadsIndex != -1)
            linkSet.loader._loads.splice(globalLoadsIndex, 1);
        }
      }
      linkSet.reject(exc);
    }
    function finishLoad(loader, load) {
      // if not anonymous, add to the module table
      if (load.name) {
        console.assert('load not in module table', !loader._modules[load.name]);
        loader._modules[load.name] = load.module;
      }
      var loadIndex = indexOf.call(loader._loads, load);
      if (loadIndex != -1)
        loader._loads.splice(loadIndex, 1);
      for (var i = 0, l = load.linkSets.length; i < l; i++) {
        loadIndex = indexOf.call(load.linkSets[i].loads, load);
        load.linkSets[i].loads.splice(loadIndex, 1);
      }
      load.linkSets = [];
    }
    function loadModule(loader, name, options) {
      return new Promise(asyncStartLoadPartwayThrough(loader, name, options && options.address ? 'fetch' : 'locate', undefined, options && options.address, undefined)).then(function(load) {
        return load;
      });
    }
    function asyncStartLoadPartwayThrough(loader, name, step, meta, address, source) {
      return function(resolve, reject) {
        if (loader._modules[name])
          throw new TypeError('Module "' + name + '" already exists in the module table');
        for (var i = 0, l = loader._loads.length; i < l; i++)
          if (loader._loads[i].name == name)
            throw new TypeError('Module "' + name + '" is already loading');

        var load = createLoad(name);

        if (meta)
          load.metadata = meta;

        var linkSet = createLinkSet(loader, load);

        loader._loads.push(load);

        // NB spec change as in https://github.com/jorendorff/js-loaders/issues/79
        linkSet.done.then(resolve, reject);

        if (step == 'locate')
          proceedToLocate(loader, load);

        else if (step == 'fetch')
          proceedToFetch(loader, load, Promise.resolve(address));

        else {
          console.assert('translate step', step == 'translate');
          load.address = address;
          proceedToTranslate(loader, load, Promise.resolve(source));
        }
      }
    }
    function evaluateLoadedModule(loader, load) {
      console.assert('is linked ' + load.name, load.status == 'linked');

      ensureEvaluated(load.module, loader);

      console.assert('is a module', load.module.module instanceof Module);

      return load.module.module;
    }
    function ensureEvaluated(module, loader) {

      // if already executed or dynamic module exists
      // dynamic modules are evaluated during linking
      if (module.module)
        return module.module;
      
      // ensure all dependencies are evaluated first
      for (var m in module.dependencies) {
        var depName = module.dependencies[m];
        // no module object means it is not executed
        if (!loader._modules[depName].module)
          ensureEvaluated(loader._modules[depName], loader);
      }

      // now evaluate this module
      traceur.options.sourceMaps = true;
      traceur.options.modules = 'instantiate';

      var reporter = new traceur.util.ErrorReporter();

      reporter.reportMessageInternal = function(location, kind, format, args) {
        throw kind + '\n' + location;
      }

      // transform

      // traceur expects its version of System
      var sys = global.System;
      global.System = global.traceurSystem;

      var tree = (new traceur.codegeneration.module.AttachModuleNameTransformer(module.name)).transformAny(module.body);
      tree = (new traceur.codegeneration.FromOptionsTransformer(reporter)).transform(tree);

      // revert system
      global.System = sys;

      delete module.body;

      // convert back to a source string
      var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: module.address });
      var options = { sourceMapGenerator: sourceMapGenerator };

      var source = traceur.outputgeneration.TreeWriter.write(tree, options);

      if (global.btoa)
        source += '\n//# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(options.sourceMap))) + '\n';

      var sysRegister = System.register;
      System.register = function(name, deps, execute) {
        for (var i = 0; i < deps.length; i++)
          deps[i] = module.dependencies[deps[i]];

        global.System = loader;
        module.module = new Module(execute.apply(global, deps));
        global.System = sys;
      }

      __eval(source, global, module.name);

      System.register = sysRegister;
    }

    // Linking
    function link(loads, loader) {
      // console.log('linking {' + logloads(loads) + '}');

      // continue until all linked
      var circular = false;
      while (loads.length) {
        circular = true;
        // search through to find a load with all its dependencies linked
        search: for (var i = 0; i < loads.length; i++) {
          var load = loads[i];
          var depNames = [];
          for (var d in load.dependencies) {
            var depName = load.dependencies[d];
            // being in the module table means it is linked
            if (!loader._modules[depName])
              continue search;
            var index = indexOf.call(load.depsList, d);
            depNames[index] = depName;
          }

          circular = false;

          // all dependencies linked now, so we can link

          if (load.kind == 'declarative') {
            load.module = {
              name: load.name,
              dependencies: load.dependencies,
              body: load.body,
              address: load.address
            };
          }
          else {
            var module = load.execute.apply(null, depNames);
            if (!(module instanceof Module))
              throw new TypeError('Execution must define a Module instance');
            load.module = {
              module: module
            };
          }
          
          load.status = 'linked';
          finishLoad(loader, load);
        }
        if (circular)
          throw new TypeError('Circular dependencies not supported by the polyfill');
      }
      // console.log('linked');
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

      defineProperty(this, 'global', {
        get: function() {
          return global;
        }
      });
      defineProperty(this, 'realm', {
        get: function() {
          throw new TypeError('Realms not implemented in polyfill');
        }
      });

      this._modules = {};
      this._loads = [];
    }

    // NB importPromises hacks ability to import a module twice without error - https://github.com/jorendorff/js-loaders/issues/60
    var importPromises = {};
    Loader.prototype = {
      define: function(name, source, options) {
        if (importPromises[name])
          throw new TypeError('Module is already loading.');
        importPromises[name] = new Promise(asyncStartLoadPartwayThrough(this, name, options && options.address ? 'fetch' : 'translate', options && options.meta || {}, options && options.address, source));
        return importPromises[name].then(function() { delete importPromises[name]; });
      },
      load: function(request, options) {
        if (this._modules[request]) {
          ensureEvaluated(this._modules[request], this);
          return Promise.resolve(this._modules[request].module);
        }
        if (importPromises[request])
          return importPromises[request];
        importPromises[request] = loadModule(this, request, options);
        return importPromises[request].then(function() { delete importPromises[request]; })
      },
      module: function(source, options) {
        var load = createLoad();
        load.address = options && options.address;
        var linkSet = createLinkSet(this, load);
        var sourcePromise = Promise.resolve(source);
        var loader = this;
        var p = linkSet.done.then(function() {
          return evaluateLoadedModule(loader, load);
        });
        proceedToTranslate(this, load, sourcePromise);
        return p;
      },
      'import': function(name, options) {
        if (this._modules[name]) {
          ensureEvaluated(this._modules[name], this);
          return Promise.resolve(this._modules[name].module);
        }
        var loader = this;
        return (importPromises[name] || (importPromises[name] = loadModule(this, name, options)))
          .then(function(load) {
            delete importPromises[name];
            return evaluateLoadedModule(loader, load);
          });
      },
      eval: function(source) {
        throw new TypeError('Eval not implemented in polyfill')
      },
      get: function(key) {
        if (!this._modules[key])
          return;
        ensureEvaluated(this._modules[key], this);
        return this._modules[key].module;
      },
      has: function(name) {
        return !!this._modules[name];
      },
      set: function(name, module) {
        if (!(module instanceof Module))
          throw new TypeError('Set must be a module');
        this._modules[name] = {
          module: module
        };
      },
      'delete': function(name) {
        return this._modules[name] ? delete this._modules[name] : false;
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

      if (!(this instanceof Module))
        return new Module(obj);

      var self = this;
      for (var key in obj) {
        (function (key, value) {
          defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function () {
              return value;
            }
          });
        })(key, obj[key]);
      }
      if (Object.preventExtensions)
        Object.preventExtensions(this);
    }
    // Module.prototype = null;


    if (typeof exports === 'object')
      module.exports = Loader;

    global.Reflect = global.Reflect || {};
    global.Reflect.Loader = global.Reflect.Loader || Loader;
    global.LoaderPolyfill = Loader;
    global.Module = Module;

  })();

  function __eval(__source, global, __moduleName) {
    try {
      eval('var __moduleName = "' + (__moduleName || '').replace('"', '\"') + '"; with(global) { (function() { ' + __source + ' \n }).call(global); }');
    }
    catch(e) {
      if (e.name == 'SyntaxError') 
        e.message = 'Evaluating ' + (__sourceURL || __moduleName) + '\n\t' + e.message;
      throw e;
    }
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
  var Promise = global.Promise || require('./promise');

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
      var resolve, reject, promise = new Promise(function(_resolve, _reject) { resolve = _resolve; reject = _reject; });
      fetchTextFromURL(toAbsoluteURL(this.baseURL, load.address), function(source) {
        resolve(source);
      }, reject);
      return promise;
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
          // <script type="module" name="" src=""> support
          var name = script.getAttribute('name');
          var address = script.getAttribute('src');
          var source = script.innerHTML;

          (name
            ? System.define(name, source, { address: address })
            : System.module(source, { address: address })
          ).then(function() {}, function(err) { nextTick(function() { throw err; }); });
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
 * SystemJS
 * 
 * Copyright (c) 2013 Guy Bedford
 * MIT License
 */

(function(__$global) {
  // helpers
  var extend = function(d, s){
    for(var prop in s) {
  	  d[prop] = s[prop]	
  	}
  	return d;
  }
	
  var cloneSystemLoader = function(System){
  	var Loader = __$global.Loader || __$global.LoaderPolyfill;
  	var loader = new Loader(System);
  	loader.baseURL = System.baseURL;
  	loader.paths = extend({}, System.paths);
  	return loader;
  }


  var upgradeLoader = function(baseLoader) {
  	var System = cloneSystemLoader(baseLoader);// Define an IE-friendly shim good-enough for purposes
var indexOf = Array.prototype.indexOf || function(item) { 
  for (var i = 0, thisLen = this.length; i < thisLen; i++) {
    if (this[i] === item)
      return i;
  }
  return -1;
}

var lastIndexOf = Array.prototype.lastIndexOf || function(c) {
  for (var i = this.length - 1; i >= 0; i--) {
    if (this[i] === c) {
      return i;
    }
  }
  return -i;
}/*
  SystemJS Core
  Adds normalization to the import function, as well as __useDefault support
*/
function core(loader) {
  (function() {

    /*
      __useDefault
      
      When a module object looks like:
      new Module({
        __useDefault: true,
        default: 'some-module'
      })

      Then the import of that module is taken to be the 'default' export and not the module object itself.

      Useful for module.exports = function() {} handling
    */
    var checkUseDefault = function(module) {
      if (!(module instanceof Module)) {
        var out = [];
        for (var i = 0; i < module.length; i++)
          out[i] = checkUseDefault(module[i]);
        return out;
      }
      return module.__useDefault ? module['default'] : module;
    }
    
    // a variation on System.get that does the __useDefault check
    loader.getModule = function(key) {
      return checkUseDefault(loader.get(key));  
    }

    // support the empty module, as a concept
    loader.set('@empty', Module({}));
    
    
    var loaderImport = loader['import'];
    loader['import'] = function(name, options) {
      // patch loader.import to do normalization
      return new Promise(function(resolve) {
        resolve(loader.normalize.call(this, name, options && options.name, options && options.address))
      })
      // add useDefault support
      .then(function(name) {
        return Promise.resolve(loaderImport.call(loader, name, options)).then(function(module) {
          return checkUseDefault(module);
        });
      });
    }

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
    var baseURI;
    if (typeof window == 'undefined') {
      baseURI = __dirname + '/';
    }
    else {
      baseURI = document.baseURI;
      if (!baseURI) {
        var bases = document.getElementsByTagName('base');
        baseURI = bases[0] && bases[0].href || window.location.href;
      }
    }

    // System.meta provides default metadata
    loader.meta = {};

    // override locate to allow baseURL to be document-relative
    var loaderLocate = loader.locate;
    var normalizedBaseURL;
    loader.locate = function(load) {
      if (this.baseURL != normalizedBaseURL)
        this.baseURL = normalizedBaseURL = toAbsoluteURL(baseURI, this.baseURL);

      var meta = loader.meta[load.name];
      for (var p in meta)
        load.metadata[p] = meta[p];

      return Promise.resolve(loaderLocate.call(this, load));
    }
    
    var loaderTranslate = loader.translate;
    loader.translate = function(load){
      // add in meta here too in case System.define was used
      var meta = loader.meta[load.name];
      for (var p in meta)
        load.metadata[p] = meta[p];
      return loaderTranslate(load);
    };

    // define exec for custom instantiations
    loader.__exec = function(load) {
      // loader on window
      var restoreLoaderAsSystem = false;
      if(load.name == '@traceur' && loader === loader.global.System) {
      	restoreLoaderAsSystem = true;
      }
      // support sourceMappingURL (efficiently)
      var sourceMappingURL;
      var lastLineIndex = load.source.lastIndexOf('\n');
      if (lastLineIndex != -1) {
        if (load.source.substr(lastLineIndex + 1, 21) == '//# sourceMappingURL=')
          sourceMappingURL = toAbsoluteURL(load.address, load.source.substr(lastLineIndex + 22));
      }

      __eval(load.source, loader.global, load.address, sourceMappingURL);

      // traceur overwrites System - write it back
      if (restoreLoaderAsSystem) {
        loader.global.traceurSystem = loader.global.System;
        loader.global.System = loader;
      }
    }

  })();

  function __eval(__source, __global, __address, __sourceMap) {
    try {
      __source = 'with(__global) { (function() { ' + __source + ' \n }).call(__global); }'
        + '\n//# sourceURL=' + __address
        + (__sourceMap ? '\n//# sourceMappingURL=' + __sourceMap : '');
      eval(__source);
    }
    catch(e) {
      if (e.name == 'SyntaxError')
        e.message = 'Evaluating ' + __address + '\n\t' + e.message;
      throw e;
    }
  }
}
/*
  SystemJS Formats

  Provides modular support for format detections.

  Also dynamically loads Traceur if ES6 syntax is found.

  Add a format with:
    System.formats.push('myformatname');
    System.format.myformat = {
      detect: function(source, load) {
        return false / depArray;
      },
      execute: function(load, deps) {
        return moduleObj; // (doesnt have to be a Module instance)
      }
    }

  The System.formats array sets the format detection order.
  
  See the AMD, global and CommonJS format extensions for examples.
*/
function formats(loader) {

  // a table of instantiating load records
  var instantiating = {};

  loader.format = {};
  loader.formats = [];

  if (typeof window != 'undefined') {
    var curScript = document.getElementsByTagName('script');
    curScript = curScript[curScript.length - 1];
    // set the path to traceur
    loader.paths['@traceur'] = curScript.getAttribute('data-traceur-src') || curScript.src.substr(0, curScript.src.lastIndexOf('/') + 1) + 'traceur.js';
  }

  // also in ESML, build.js
  var es6RegEx = /(?:^\s*|[}{\(\);,\n]\s*)(import\s+['"]|(import|module)\s+[^"'\(\)\n;]+\s+from\s+['"]|export\s+(\*|\{|default|function|var|const|let|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*))/;
  
  // es6 module forwarding - allow detecting without Traceur
  var aliasRegEx = /^\s*export\s*\*\s*from\s*(?:'([^']+)'|"([^"]+)")/;

  // module format hint regex
  var formatHintRegEx = /^(\s*(\/\*.*\*\/)|(\/\/[^\n]*))*(["']use strict["'];?)?["']([^'"]+)["'][;\n]/;

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var name = load.name || '';

    load.source = load.source || '';

    // set load.metadata.format from metadata or format hints in the source
    var format = load.metadata.format;
    if (!format) {
      var formatMatch = load.source.match(formatHintRegEx);
      if (formatMatch)
        format = load.metadata.format = formatMatch[5];
    }

    if (name == '@traceur')
      format = 'global';

    // es6 handled by core

    // support alias modules without needing Traceur
    var match;
    if (!loader.global.traceur && (format == 'es6' || !format) && (match = load.source.match(aliasRegEx))) {
      return {
        deps: [match[1] || match[2]],
        execute: function(depName) {
          return loader.get(depName);
        }
      };
    }

    if (format == 'es6' || !format && load.source.match(es6RegEx)) {
      // dynamically load Traceur if necessary
      if (!loader.global.traceur)
        return loader['import']('@traceur').then(function() {
          return loaderInstantiate.call(loader, load);
        });
      else
        return loaderInstantiate.call(loader, load);
    }

    // if it is shimmed, assume it is a global script

    if (load.metadata.exports || load.metadata.deps)
      format = 'global';

    // if we don't know the format, run detection first
    if (!format || !this.format[format])
      for (var i = 0; i < this.formats.length; i++) {
        var f = this.formats[i];
        var curFormat = this.format[f];
        if (curFormat.detect(load)) {
          format = f;
          break;
        }
      }

    var curFormat = this.format[format];

    // if we don't have a format or format rule, throw
    if (!format || !curFormat)
      throw new TypeError('No format found for ' + (format ? format : load.address));

    load.metadata.format = format;
	instantiating[load.name] = load;

    // now invoke format instantiation
    var deps = curFormat.deps(load);

    // remove duplicates from deps first
    for (var i = 0; i < deps.length; i++)
      if (lastIndexOf.call(deps, deps[i]) != i)
        deps.splice(i--, 1);

    return {
      deps: deps,
      execute: function() {
        var output = curFormat.execute.call(this, Array.prototype.splice.call(arguments, 0, arguments.length), load);
		delete instantiating[load.name];
        if (output instanceof loader.global.Module)
          return output;
        else
          return new loader.global.Module(output && output.__esModule ? output : { __useDefault: true, 'default': output });
      }
    };
  };
  var systemFormatNormalize = loader.normalize;
  loader.normalize = function(name, refererName, refererAdress) {
  	var load = instantiating[refererName],
  		format = load && this.format[load.metadata.format],
  		normalize = format && format.normalize;
  	if(normalize) {
  		return normalize.call(this, name, refererName, refererAdress, systemFormatNormalize);
  		if(res != null) {
  			return res;
  		}
  	} 
	return systemFormatNormalize.apply(this, arguments);
  	
  };


}
/*
  SystemJS AMD Format
  Provides the AMD module format definition at System.format.amd
  as well as a RequireJS-style require on System.require
*/
function formatAMD(loader) {
  loader.formats.push('amd');

  // AMD Module Format Detection RegEx
  // define([.., .., ..], ...)
  // define(varName); || define(function(require, exports) {}); || define({})
  var amdRegEx = /(?:^\s*|[}{\(\);,\n\?\&]\s*)define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?(\[(\s*("[^"]+"|'[^']+')\s*,)*(\s*("[^"]+"|'[^']+')\s*)?\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.require
  */
  var require = loader.require = function(names, callback, errback, referer) {
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
    else if (typeof names == 'string')
      return loader.getModule(names);

    else
      throw 'Invalid require';
  };
  function makeRequire(parentName, deps, depsNormalized) {
    return function(names, callback, errback) {
      if (typeof names == 'string' && indexOf.call(deps, names) != -1)
        return loader.getModule(depsNormalized[indexOf.call(deps, names)]);
      return require(names, callback, errback, { name: parentName });
    }
  }

  function prepareDeps(deps, meta) {
    for (var i = 0; i < deps.length; i++)
      if (lastIndexOf.call(deps, deps[i]) != i)
        deps.splice(i--, 1);

    // remove system dependencies
    var index;
    if ((index = indexOf.call(deps, 'require')) != -1) {
      meta.requireIndex = index;
      deps.splice(index, 1);
    }
    if ((index = indexOf.call(deps, 'exports')) != -1) {
      meta.exportsIndex = index;
      deps.splice(index, 1);
    }
    if ((index = indexOf.call(deps, 'module')) != -1) {
      meta.moduleIndex = index;
      deps.splice(index, 1);
    }

    return deps;
  }

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

    // add back in system dependencies
    if (meta.moduleIndex !== undefined)
      deps.splice(meta.moduleIndex, 0, exports = {}, module = { id: load.name, uri: load.address, config: function() { return {}; }, exports: exports });
    if (meta.exportsIndex !== undefined)
      deps.splice(meta.exportsIndex, 0, exports = exports || {});
    if (meta.requireIndex !== undefined)
      deps.splice(meta.requireIndex, 0, makeRequire(load.name, meta.deps, depNames));

    return {
      deps: deps,
      module: module || exports && { exports: exports }
    };
  }

  loader.format.amd = {
    detect: function(load) {
      return !!load.source.match(amdRegEx);
    },
    deps: function(load) {

      var global = loader.global;

      var deps;
      var meta = load.metadata;
      var defined = false;
      global.define = function(name, _deps, factory) {
      	
        if (typeof name != 'string') {
          factory = _deps;
          _deps = name;
          name = null;
        }

        // anonymous modules must only call define once
        if (!name && defined) {
          throw "Multiple anonymous defines for module " + load.name;
        }
        if (!name) {
          defined = true;
        }

        if (!(_deps instanceof Array)) {
          factory = _deps;
          // CommonJS AMD form
          var src = load.source;
          load.source = factory.toString();
          _deps = ['require', 'exports', 'module'].concat(loader.format.cjs.deps(load, global));
          load.source = src;
        }
        
        if (typeof factory != 'function')
          factory = (function(factory) {
            return function() { return factory; }
          })(factory);
        
        if (name && name != load.name) {
          // named define for a bundle describing another module
          var _load = {
            name: name,
            address: name,
            metadata: {}
          };
          _load.metadata.deps = _deps = prepareDeps(_deps, _load.metadata);
          
          loader.defined[name] = {
            deps: _deps,
            execute: function() {
              var execs = prepareExecute(Array.prototype.splice.call(arguments, 0, arguments.length), _load);
              var output = factory.apply(global, execs.deps) || execs.module && execs.module.exports;

              if (output instanceof global.Module)
                return output;
              else
                return new global.Module(output && output.__esModule ? output : { __useDefault: true, 'default': output });
            }
          };
        }
        else {
          // we are defining this module
          deps = _deps;
          meta.factory = factory;
        }
      };
      global.define.amd = {};

      // ensure no NodeJS environment detection
      global.module = undefined;
      global.exports = undefined;

      loader.__exec(load);

      // deps not defined for an AMD module that defines a different name
      deps = deps || [];

      deps = prepareDeps(deps, meta);

      global.define = undefined;

      meta.deps = deps;

      return deps;

    },
    execute: function(depNames, load) {
      if (!load.metadata.factory)
        return;
      var execs = prepareExecute(depNames, load);
      return load.metadata.factory.apply(loader.global, execs.deps) || execs.module && execs.module.exports;
    }
  };
}/*
  SystemJS CommonJS Format
  Provides the CommonJS module format definition at System.format.cjs
*/
function formatCJS(loader) {
  loader.formats.push('cjs');

  // CJS Module Format
  // require('...') || exports[''] = ... || exports.asd = ... || module.exports = ...
  var cjsExportsRegEx = /(?:^\s*|[}{\(\);,\n=:\?\&]\s*|module\.)(exports\s*\[\s*('[^']+'|"[^"]+")\s*\]|\exports\s*\.\s*[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*|exports\s*\=)/;
  var cjsRequireRegEx = /(?:^\s*|[}{\(\);,\n=:\?\&]\s*)require\s*\(\s*("([^"]+)"|'([^']+)')\s*\)/g;
  var commentRegEx = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;

  var noop = function() {}
  var nodeProcess = {
    nextTick: function(f) {
      setTimeout(f, 7);
    },
    browser: true,
    env: {},
    argv: [],
    on: noop,
    once: noop,
    off: noop,
    emit: noop,
    cwd: function() { return '/' }
  };
  loader.set('@@nodeProcess', Module(nodeProcess));

  loader.format.cjs = {
    detect: function(load) {
      cjsExportsRegEx.lastIndex = 0;
      cjsRequireRegEx.lastIndex = 0;
      return !!(cjsRequireRegEx.exec(load.source) || cjsExportsRegEx.exec(load.source));
    },
    deps: function(load) {
      cjsExportsRegEx.lastIndex = 0;
      cjsRequireRegEx.lastIndex = 0;

      var deps = [];

      // remove comments from the source first
      var source = load.source.replace(commentRegEx, '');

      var match;

      while (match = cjsRequireRegEx.exec(source))
        deps.push(match[2] || match[3]);

      load.metadata.deps = deps;

      return deps;
    },
    execute: function(depNames, load) {
      var dirname = load.address.split('/');
      dirname.pop();
      dirname = dirname.join('/');

      var deps = load.metadata.deps;

      var globals = loader.global._g = {
        global: loader.global,
        exports: {},
        process: nodeProcess,
        require: function(d) {
          var index = indexOf.call(deps, d);
          if (index != -1)
            return loader.getModule(depNames[index]);
        },
        __filename: load.address,
        __dirname: dirname,
      };
      globals.module = { exports: globals.exports };

      var glString = '';
      for (var _g in globals)
        glString += 'var ' + _g + ' = _g.' + _g + ';';

      var execLoad = {
      	name: load.name,
      	source: glString + load.source,
      	address: load.address
      };
      loader.__exec(execLoad);

      loader.global._g = undefined;

      return globals.module.exports;
    }
  };
}/*
  SystemJS Global Format
  Provides the global support at System.format.global
  Supports inline shim syntax with:
    "global";
    "import jquery";
    "export my.Global";

  Also detects writes to the global object avoiding global collisions.
  See the SystemJS readme global support section for further information.
*/
function formatGlobal(loader) {
  loader.formats.push('global');

  // Global
  var globalShimRegEx = /(["']global["'];\s*)((['"]import [^'"]+['"];\s*)*)(['"]export ([^'"]+)["'])?/;
  var globalImportRegEx = /(["']import [^'"]+)+/g;

  // given a module's global dependencies, prepare the global object
  // to contain the union of the defined properties of its dependent modules
  var moduleGlobals = {};

  // also support a loader.shim system
  loader.shim = {};

  loader.format.global = {
    detect: function() {
      return true;
    },
    deps: function(load) {
      var match, deps;
      if (match = load.source.match(globalShimRegEx)) {
        deps = match[2].match(globalImportRegEx);
        if (deps)
          for (var i = 0; i < deps.length; i++)
            deps[i] = deps[i].substr(8);
        load.metadata.exports = match[5];
      }
      deps = deps || [];
      if (load.metadata.deps)
        deps = deps.concat(load.metadata.deps);
      return deps;
    },
    execute: function(depNames, load) {
      var hasOwnProperty = loader.global.hasOwnProperty;
      var globalExport = load.metadata.exports;

      // first, we add all the dependency module properties to the global
      for (var i = 0; i < depNames.length; i++) {
        var moduleGlobal = moduleGlobals[depNames[i]];
        if (moduleGlobal)
          for (var m in moduleGlobal)
            loader.global[m] = moduleGlobal[m];
      }

      // now store a complete copy of the global object
      // in order to detect changes
      var globalObj = {};
      for (var g in loader.global)
        if (!hasOwnProperty || loader.global.hasOwnProperty(g))
          globalObj[g] = loader.global[g];

      if (globalExport)
        load.source += '\nthis["' + globalExport + '"] = ' + globalExport;

      loader.__exec(load);

      // check for global changes, creating the globalObject for the module
      // if many globals, then a module object for those is created
      // if one global, then that is the module directly
      var singleGlobal, moduleGlobal;
      if (globalExport) {
        var firstPart = globalExport.split('.')[0];
        singleGlobal = eval.call(loader.global, globalExport);
        moduleGlobal = {};
        moduleGlobal[firstPart] = loader.global[firstPart];
      }
      else {
        moduleGlobal = {};
        for (var g in loader.global) {
          if (!hasOwnProperty && (g == 'sessionStorage' || g == 'localStorage' || g == 'clipboardData' || g == 'frames'))
            continue;
          if ((!hasOwnProperty || loader.global.hasOwnProperty(g)) && g != loader.global && globalObj[g] != loader.global[g]) {
            moduleGlobal[g] = loader.global[g];
            if (singleGlobal) {
              if (singleGlobal !== loader.global[g])
                singleGlobal = false;
            }
            else if (singleGlobal !== false)
              singleGlobal = loader.global[g];
          }
        }
      }
      moduleGlobals[load.name] = moduleGlobal;
      
      if (singleGlobal)
        return singleGlobal;
      else
        return new Module(moduleGlobal);
    }
  };
}
/*
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
  function applyMap(name, parentName) {

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
  var mapped = {};
  loader.normalize = function(name, parentName, parentAddress) {
    return Promise.resolve(loaderNormalize.call(loader, name, parentName, parentAddress))
    .then(function(name) {
      return applyMap(name, parentName);
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
  var loaderNormalize = loader.normalize;
  loader.normalize = function(name, parentName, parentAddress) {
    // if parent is a plugin, normalize against the parent plugin argument only
    var parentPluginIndex;
    if (parentName && (parentPluginIndex = parentName.indexOf('!')) != -1)
      parentName = parentName.substr(0, parentPluginIndex);

    return Promise.resolve(loaderNormalize(name, parentName, parentAddress))
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
    var name = load.name;

    // plugin
    var pluginIndex = name.lastIndexOf('!');
    if (pluginIndex != -1) {
      var pluginName = name.substr(pluginIndex + 1);

      // the name to locate is the plugin argument only
      load.name = name.substr(0, pluginIndex);
      
      var pluginLoader = loader.pluginLoader || loader;
      // load the plugin module
      return pluginLoader.load(pluginName)
      .then(function() {
        var plugin = pluginLoader.get(pluginName);
        plugin = plugin['default'] || plugin;

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
          return new Promise(function(resolve) {
            resolve(loader.locate(load));
          })
          .then(function(address) {
            return address.substr(0, address.length - 3);
          });
      });
    }

    return loaderLocate.call(this, load);
  };

  var loaderFetch = loader.fetch;
  loader.fetch = function(load) {
    // support legacy plugins
    var self = this;
    if (typeof load.metadata.plugin == 'function') {
      return new Promise(function(fulfill, reject) {
        load.metadata.plugin(load.metadata.pluginArgument, load.address, function(url, callback, errback) {
          loaderFetch.call(self, { name: load.name, address: url, metadata: {} }).then(callback, errback);
        }, fulfill, reject);
      });
    }
    return (load.metadata.plugin && load.metadata.plugin.fetch || loaderFetch).call(this, load);
  };

  var loaderTranslate = loader.translate;
  loader.translate = function(load) {
    var plugin = load.metadata.plugin;
    if (plugin && plugin.translate)
      return plugin.translate.call(this, load);

    return loaderTranslate.call(this, load);
  };
  
  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load){
  	var plugin = load.metadata.plugin;
    if (plugin && plugin.instantiate)
      return plugin.instantiate.call(this, load);

    return loaderInstantiate.call(this, load);
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
  // bundles support (just like RequireJS)
  // bundle name is module name of bundle itself
  // bundle is array of modules defined by the bundle
  // when a module in the bundle is requested, the bundle is loaded instead
  // of the form System.bundles['mybundle'] = ['jquery', 'bootstrap/js/bootstrap']
  loader.bundles = loader.bundles || {};

  var loaderFetch = loader.fetch;
  loader.fetch = function(load) {
    // if this module is in a bundle, load the bundle first then
    for (var b in loader.bundles) {
      if (indexOf.call(loader.bundles[b], load.name) == -1)
        continue;
      // we do manual normalization in case the bundle is mapped
      // this is so we can still know the normalized name is a bundle
      return Promise.resolve(loader.normalize(b))
      .then(function(normalized) {
        loader.bundles[normalized] = loader.bundles[normalized] || loader.bundles[b];
        return loader.load(normalized);
      })
      .then(function() {
        return '';
      });
    }
    return loaderFetch.apply(this, arguments);
  };

  var loaderLocate = loader.locate;
  loader.locate = function(load) {
    if (loader.bundles[load.name])
      load.metadata.bundle = true;
    return loaderLocate.call(this, load);
  };

}/*
  Implementation of the loader.register bundling method

  This allows the output of Traceur to populate the
  module registry of the loader loader
*/

function register(loader) {

  // instantiation cache for loader.register
  loader.defined = {};

  // register a new module for instantiation
  loader.register = function(name, deps, execute) {
    loader.defined[name] = {  
      deps: deps,
      execute: function() {
        return Module(execute.apply(this, arguments));
      }
    };
  }
  
  var loaderLocate = loader.locate;
  loader.locate = function(load) {
    if (loader.defined[load.name])
      return '';
    return loaderLocate.apply(this, arguments);
  }
  
  var loaderFetch = loader.fetch;
  loader.fetch = function(load) {
    // if the module is already defined, skip fetch
    if (loader.defined[load.name])
      return '';
    return loaderFetch.apply(this, arguments);
  }

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    // if the module has been defined by a bundle, use that
    if (loader.defined[load.name]) {
      var instantiateResult = loader.defined[load.name];
      delete loader.defined[load.name];
      return instantiateResult;
    }

    return loaderInstantiate.apply(this, arguments);
  }

}
/*
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
  
  var loaderNormalize = loader.normalize;

  loader.versions = loader.versions || {};

  // hook normalize and store a record of all versioned packages
  loader.normalize = function(name, parentName, parentAddress) {
    var packageVersions = loader.versions;
    // run all other normalizers first
    return Promise.resolve(loaderNormalize.call(this, name, parentName, parentAddress)).then(function(normalized) {
      
      var version, semverMatch, nextChar, versions;
      var index = normalized.indexOf('@');

      // see if this module corresponds to a package already in our versioned packages list
      
      // no version specified - check against the list (given we don't know the package name)
      if (index == -1) {
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
  core(System);
  formats(System);
  formatAMD(System);
  formatCJS(System);
  formatGlobal(System);
  map(System);
  plugins(System);
  bundles(System);
  register(System);
  versions(System);

  if (__$global.systemMainEntryPoint)
    System['import'](__$global.systemMainEntryPoint);
  return System;
}; // upgradeLoader end

(function() {
  if (typeof window != 'undefined') {
    /*var scripts = document.getElementsByTagName('script');
    var curScript = scripts[scripts.length - 1];
    __$global.systemMainEntryPoint = curScript.getAttribute('data-main');*/
  }
  
  __$global.upgradeSystemLoader = function(){
    __$global.upgradeSystemLoader = undefined;
    var originalSystemLoader = __$global.System;
    __$global.System = upgradeLoader(System);
    __$global.System.clone = function(){
      	return upgradeLoader(originalSystemLoader);
    }
  };
  if (!__$global.System || __$global.System.registerModule) {
    if (typeof window != 'undefined') {
      // determine the current script path as the base path
      var curPath = curScript.src;
      var basePath = curPath.substr(0, curPath.lastIndexOf('/') + 1);
      
      document.write(
        '<' + 'script type="text/javascript" src="' + basePath + 'es6-module-loader.js" data-init="upgradeSystemLoader">' + '<' + '/script>'
      );
    }
    else {
      var es6ModuleLoader = require('es6-module-loader');
      var originalSystemLoader = es6ModuleLoader.System;
      __$global.System = es6ModuleLoader.System;
      __$global.Loader = es6ModuleLoader.Loader;
      __$global.Module = es6ModuleLoader.Module;
      __$global.upgradeSystemLoader();
      module.exports = __$global.System;
      
    }
  }
  else {
    __$global.upgradeSystemLoader();
  }
  /*if (typeof window != 'undefined') {
    var configPath = curScript.getAttribute('data-config');
    if (configPath)
      document.write('<' + 'script type="text/javascript src="' + configPath + '">' + '<' + '/script>');
  }*/
})();


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
	meta: getSetToSystem("meta")
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
			
			if(lastPart.indexOf("steal") === 0 && !System.paths["steal/dev/dev"]) {
				options.paths = {
					"steal/*": parts.join("/")+"/*.js",
					"@traceur": parts.slice(0,-1).join("/")+"/traceur/traceur.js"
				};
				
			}
			
			if ( last(parts) === "steal" ) {
				parts.pop();
				if ( last(parts) === "bower_components" ) {
					parts.pop();
				}
			}
			var root = parts.join("/");
			options.root = root+"/";
			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						 attr.nodeName.replace("data-","") :
						 attr.nodeName );
						 
				options[optionName] = attr.value;
			});
			
		}
	
		return options;
	};
	
	var getOptionsFromStealLocation = function(){
		var options = {};
		if(typeof __dirname === "string" && !System.paths["steal/dev/dev"]) {
			options.paths = {
				"steal/*": __dirname+"/*.js",
				"@traceur": __dirname.split("/").slice(0,-1).join("/")+"/traceur/traceur.js"
			};
		}
		return options;
	};
	
	steal.startup = function(config){
		
		// get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			var urlOptions = getOptionsFromStealLocation();
		}
		if(!System.map.css) {
			System.map.css = "steal/css";	
		}

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		steal.config(urlOptions);
		
		var options = steal.config();
	
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
		if ( options.env == "production" ) {
			
			return appDeferred = steal.System.import(steal.System.main)["catch"](function(e){
				console.log(e);
			});
			
		} else if(options.env == "development"){
			
			configDeferred = steal.System.import("stealconfig");
			
			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
 				// what was loaded in stealconfig.js
				if(config) {
					steal.config(config);
				}

				return steal("steal/dev");
			},function(){
				console.log("steal - error loading stealconfig.");
				return steal("steal/dev");
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

  


	if (typeof window != 'undefined') {
		window.steal = makeSteal(System);
		window.steal.startup();
		window.steal.addFormat = addFormat;
    }
    else {
    	var steal = makeSteal(System);
		steal.System = System;
		steal.dev = require("./dev/dev.js");
		steal.clone = makeSteal;
		module.exports = steal;
		global.steal = steal;
		global.steal.addFormat = addFormat;
    }
    
})(typeof window == "undefined" ? global : window);