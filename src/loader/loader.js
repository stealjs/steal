(function(__global) {

var isWorker = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined'
  && self instanceof WorkerGlobalScope;
var isBrowser = typeof window != 'undefined' && !isWorker;

__global.$__Object$getPrototypeOf = Object.getPrototypeOf || function(obj) {
  return obj.__proto__;
};

var $__Object$defineProperty;
(function () {
  try {
    if (!!Object.defineProperty({}, 'a', {})) {
      $__Object$defineProperty = Object.defineProperty;
    }
  } catch (e) {
    $__Object$defineProperty = function (obj, prop, opt) {
      try {
        obj[prop] = opt.value || opt.get.call(obj);
      }
      catch(e) {}
    }
  }
}());

__global.$__Object$create = Object.create || function(o, props) {
  function F() {}
  F.prototype = o;

  if (typeof(props) === "object") {
    for (prop in props) {
      if (props.hasOwnProperty((prop))) {
        F[prop] = props[prop];
      }
    }
  }
  return new F();
};

var $__Object$defineProperties = Object.defineProperties;
var $__Object$defineProperty0 = Object.defineProperty;
var $__Object$create = Object.create;
var $__Object$getPrototypeOf = Object.getPrototypeOf;


(function() {
  var Promise = __global.Promise || require("when/es6-shim/Promise");
  var console;
  var $__curScript;
  if (__global.console) {
    console = __global.console;
    console.assert = console.assert || function() {};
  } else {
    console = { assert: function() {} };
  }
  if(isBrowser) {
    var scripts = document.getElementsByTagName("script");
    $__curScript = document.currentScript || scripts[scripts.length - 1];
  }


  // IE8 support
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, thisLen = this.length; i < thisLen; i++) {
      if (this[i] === item) {
        return i;
      }
    }
    return -1;
  };
  var defineProperty = $__Object$defineProperty;
  var emptyArray = [];

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
      status: "loading",
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
      step: options.address ? "fetch" : "locate",
      loader: loader,
      moduleName: name,
      // allow metadata for import https://bugs.ecmascript.org/show_bug.cgi?id=3091
      moduleMetadata: options && options.metadata || {},
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
    .then(function(name) {
      return Promise.resolve(loader.loaderObj.notifyLoad(request, name, refererName))
      .then(function() {
        return name;
      });
    })
	// 15.2.4.2.2 GetOrCreateLoad
    .then(function(name) {
      var load;
      if (loader.modules[name]) {
        load = createLoad(name);
        load.status = "linked";
        // https://bugs.ecmascript.org/show_bug.cgi?id=2795
        load.module = loader.modules[name];
        return load;
      }

      for (var i = 0, l = loader.loads.length; i < l; i++) {
        load = loader.loads[i];
        if (load.name != name)
          continue;
        console.assert(load.status == "loading" || load.status == "loaded", "loading or loaded");
        return load;
      }

      var failedLoads = loader.loaderObj.failed || emptyArray;
      for(var i = 0, l = failedLoads.length; i < l; i++) {
        load = failedLoads[i];
        if(load.name !== name)
          continue;
        return Promise.reject("The load " + name + " already failed.");
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
        if (load.status != "loading")
          return;
        load.address = address;

        return loader.loaderObj.fetch({ name: load.name, metadata: load.metadata, address: address });
      })
    );
  }

  var anonCnt = 0;

  // 15.2.4.5
  function proceedToTranslate(loader, load, p) {
    var pass = load.pass || 0;
    var passCancelled = function() {
      return (load.pass << 0) !== pass ;
    };

    p
    // 15.2.4.5.1 CallTranslate
    .then(function(source) {
      if (load.status != "loading")
        return;

      return Promise.resolve(loader.loaderObj.translate({ name: load.name, metadata: load.metadata, address: load.address, source: source }))

      // 15.2.4.5.2 CallInstantiate
      .then(function(source) {
        if(load.status != "loading" || passCancelled()) {
          return;
        }
        load.source = source;
        return loader.loaderObj.instantiate({ name: load.name, metadata: load.metadata, address: load.address, source: source });
      })

      // 15.2.4.5.3 InstantiateSucceeded
      .then(function(instantiateResult) {
        if(load.status != "loading" || passCancelled()) {
          return;
        }
        if (instantiateResult === undefined) {
          load.address = load.address || "<Anonymous Module " + ++anonCnt + ">";

          // instead of load.kind, use load.isDeclarative
          load.isDeclarative = true;
          return loader.loaderObj.transpile(load)
          .then(function(transpiled) {
            // Hijack System.register to set declare function
            var curSystem = __global.System;
            var curRegister = curSystem.register;
            curSystem.register = function(name, regDeps, regDeclare) {
              var declare = regDeclare;
              var deps = regDeps;
              if (typeof name != "string") {
                declare = deps;
                deps = name;
              }

              load.declare = declare;
              load.depsList = deps;
            };
            __eval(transpiled, __global, load);
            curSystem.register = curRegister;
          });
        }
        else if (typeof instantiateResult == "object") {
          load.depsList = instantiateResult.deps || [];
          load.execute = instantiateResult.execute;
          load.isDeclarative = false;
        }
        else
          throw TypeError("Invalid instantiate return value");
      })
      // 15.2.4.6 ProcessLoadDependencies
      .then(function() {
        if(load.status != "loading" || passCancelled()) {
          return;
        }
        load.dependencies = [];
        var depsList = load.depsList;

        var loadPromises = [];
        function loadDep(request, index) {
          loadPromises.push(
            requestLoad(loader, request, load.name, load.address)

            // 15.2.4.6.1 AddDependencyLoad (load is parentLoad)
            .then(function(depLoad) {
              // adjusted from spec to maintain dependency order
              // this is due to the System.register internal implementation needs
              load.dependencies[index] = {
                key: request,
                value: depLoad.name
              };

              // console.log('AddDependencyLoad ' + depLoad.name + ' for ' + load.name);
              // snapshot(loader);
              if (depLoad.status != "linked") {
                var linkSets = load.linkSets.concat([]);
                for (var i = 0, l = linkSets.length; i < l; i++)
                  addLoadToLinkSet(linkSets[i], depLoad);
              }
            })
          );
        }
        for (var i = 0, l = depsList.length; i < l; i++) {
          loadDep(depsList[i], i);
        }

        return Promise.all(loadPromises);
      })

      // 15.2.4.6.2 LoadSucceeded
      .then(function() {
        // console.log('LoadSucceeded ' + load.name);
        // snapshot(loader);
        if(load.status != "loading" || passCancelled()) {
          return;
        }

        console.assert(load.status == "loading", "is loading");

        load.status = "loaded";

        var linkSets = load.linkSets.concat([]);
        for (var i = 0, l = linkSets.length; i < l; i++)
          updateLinkSetOnLoad(linkSets[i], load);
      });
    })
    // 15.2.4.5.4 LoadFailed
    ["catch"](function(exc) {
      load.status = "failed";
      load.exception = exc;

      var linkSets = load.linkSets.concat([]);
      for (var i = 0, l = linkSets.length; i < l; i++) {
        linkSetFailed(linkSets[i], load, exc);
      }

      console.assert(load.linkSets.length == 0, "linkSets not removed");
    });
  }

  // 15.2.4.7 PromiseOfStartLoadPartwayThrough absorbed into calling functions
  function incrementPass(load) {
    load.pass = load.pass != null ? (load.pass + 1) : 1;
  }

  function changeLoadingStatus(load, newStatus) {
    var oldStatus = load.status;

    load.status = newStatus;
    if(newStatus !== oldStatus && oldStatus === "loaded") {
      load.linkSets.forEach(function(linkSet){
        linkSet.loadingCount++;
      });
    }
  }

  // 15.2.4.7.1
  function asyncStartLoadPartwayThrough(stepState) {
    return function(resolve, reject) {
      var loader = stepState.loader;
      var name = stepState.moduleName;
      var step = stepState.step;
      var importingModuleName = stepState.moduleMetadata.importingModuleName;

      if (loader.modules[name])
        throw new TypeError("\"" + name + "\" already exists in the module table");

      // adjusted to pick up existing loads
      var existingLoad, firstLinkSet;
      for (var i = 0, l = loader.loads.length; i < l; i++) {
        if (loader.loads[i].name == name) {
          existingLoad = loader.loads[i];

          if(step == "translate" && !existingLoad.source) {
            existingLoad.address = stepState.moduleAddress;
            proceedToTranslate(loader, existingLoad, Promise.resolve(stepState.moduleSource));
          }

          // If the module importing this is part of the same linkSet, create
          // a new one for this import.
          firstLinkSet = existingLoad.linkSets[0];
          if(importingModuleName && firstLinkSet.loads[importingModuleName]) {
            continue;
          }

          return firstLinkSet.done.then(function() {
            resolve(existingLoad);
          });
        }
      }

      var load;
      if(existingLoad) {
        load = existingLoad;
      } else {
        load = createLoad(name);
        load.metadata = stepState.moduleMetadata;
      }

      var linkSet = createLinkSet(loader, load);

      if(!existingLoad) {
        loader.loads.push(load);
      }

      resolve(linkSet.done);

      if (step == "locate")
        proceedToLocate(loader, load);

      else if (step == "fetch")
        proceedToFetch(loader, load, Promise.resolve(stepState.moduleAddress));

      else {
        console.assert(step == "translate", "translate step");
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
      startingLoad: startingLoad, // added see spec bug https://bugs.ecmascript.org/show_bug.cgi?id=2995
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
    console.assert(load.status == "loading" || load.status == "loaded" || load.status === "failed",
		"loading or loaded on link set");

    for (var i = 0, l = linkSet.loads.length; i < l; i++)
      if (linkSet.loads[i] == load)
        return;

    linkSet.loads.push(load);
    linkSet.loads[load.name] = true;
    load.linkSets.push(linkSet);

    // adjustment, see https://bugs.ecmascript.org/show_bug.cgi?id=2603
    if (load.status != "loaded") {
      linkSet.loadingCount++;
    }

    var loader = linkSet.loader;

    // console.log('add to linkset ' + load.name);
    // snapshot(linkSet.loader);
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
  }

  // linking errors can be generic or load-specific
  // this is necessary for debugging info
  function doLink(linkSet) {
    var error = false;
    try {
      link(linkSet, function(load, exc) {
        linkSetFailed(linkSet, load, exc);
        error = true;
      });
    }
    catch(e) {
      linkSetFailed(linkSet, null, e);
      error = true;
    }
    return error;
  }

  // 15.2.5.2.3
  function updateLinkSetOnLoad(linkSet, load) {
    // console.log('update linkset on load ' + load.name);
    // snapshot(linkSet.loader);

    console.assert(load.status == "loaded" || load.status == "linked", "loaded or linked");

    linkSet.loadingCount--;

    if (linkSet.loadingCount > 0)
      return;

    // adjusted for spec bug https://bugs.ecmascript.org/show_bug.cgi?id=2995
    var startingLoad = linkSet.startingLoad;

    // non-executing link variation for loader tracing
    // on the server. Not in spec.
    /***/
    if (linkSet.loader.loaderObj.execute === false) {
      var loads = [].concat(linkSet.loads);
      for (var i = 0, l = loads.length; i < l; i++) {
        var load = loads[i];
        load.module = !load.isDeclarative ? {
          module: _newModule({})
        } : {
          name: load.name,
          module: _newModule({}),
          evaluated: true
        };
        load.status = "linked";
        finishLoad(linkSet.loader, load);
      }
      return linkSet.resolve(startingLoad);
    }
    /***/

    var abrupt = doLink(linkSet);

    if (abrupt)
      return;

    console.assert(linkSet.loads.length == 0, "loads cleared");

    linkSet.resolve(startingLoad);
  }

  // 15.2.5.2.4
  function linkSetFailed(linkSet, load, linkExc) {
    var loader = linkSet.loader;
    var exc = linkExc;

    /*
    if (linkSet.loads[0].name != load.name)
      exc = addToError(exc, 'Error loading "' + load.name + '" from "' + linkSet.loads[0].name + '" at ' + (linkSet.loads[0].address || '<unknown>') + '\n');

    exc = addToError(exc, 'Error loading "' + load.name + '" at ' + (load.address || '<unknown>') + '\n');
    */

    var loads = linkSet.loads.concat([]);
    for (var i = 0, l = loads.length; i < l; i++) {
      var load = loads[i];

      // store all failed load records
      loader.loaderObj.failed = loader.loaderObj.failed || [];
      if (load.status === "failed" && indexOf.call(loader.loaderObj.failed, load) == -1)
        loader.loaderObj.failed.push(load);
	  else if(loader.loaderObj._pendingState)
	  	loader.loaderObj._pendingState(load);

      var linkIndex = indexOf.call(load.linkSets, linkSet);
      console.assert(linkIndex != -1, "link not present");
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
        deps: load.dependencies.map(function(dep){
          return dep.key ;
        }),
        depMap: depMap,
        address: load.address,
        metadata: load.metadata,
        source: load.source,
        kind: load.isDeclarative ? "declarative" : "dynamic"
      };
    }
    // if not anonymous, add to the module table
    if (load.name) {
      console.assert(!loader.modules[load.name], "load not in module table");
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
  function buildLinkageGroups(load, loads, groups) {
    groups[load.groupIndex] = groups[load.groupIndex] || [];

    // if the load already has a group index and its in its group, its already been done
    // this logic naturally handles cycles
    if (indexOf.call(groups[load.groupIndex], load) != -1)
      return;

    // now add it to the group to indicate its been seen
    groups[load.groupIndex].push(load);

    for (var i = 0, l = loads.length; i < l; i++) {
      var loadDep = loads[i];

      // dependencies not found are already linked
      for (var j = 0; j < load.dependencies.length; j++) {
        if (loadDep.name == load.dependencies[j].value) {
          // by definition all loads in linkset are loaded, not linked
          console.assert(loadDep.status == "loaded", "Load in linkSet not loaded!");

          // if it is a group transition, the index of the dependency has gone up
          // otherwise it is the same as the parent
          var loadDepGroupIndex = load.groupIndex + (loadDep.isDeclarative != load.isDeclarative);

          // the group index of an entry is always the maximum
          if (loadDep.groupIndex === undefined || loadDep.groupIndex < loadDepGroupIndex) {
            // if already in a group, remove from the old group
            if (loadDep.groupIndex !== undefined) {
              groups[loadDep.groupIndex].splice(indexOf.call(groups[loadDep.groupIndex], loadDep), 1);

              // if the old group is empty, then we have a mixed depndency cycle
              if (groups[loadDep.groupIndex].length == 0)
                throw new TypeError("Mixed dependency cycle detected");
            }

            loadDep.groupIndex = loadDepGroupIndex;
          }

          buildLinkageGroups(loadDep, loads, groups);
        }
      }
    }
  }

  function doDynamicExecute(linkSet, load, linkError) {
    try {
      var module = load.execute();
    }
    catch(e) {
      linkError(load, e);
      return;
    }
    if (!module || !(module instanceof Module))
      linkError(load, new TypeError("Execution must define a Module instance"));
    else
      return module;
  }

  // 15.2.5.4
  function link(linkSet, linkError) {
    var loader = linkSet.loader;

    if (!linkSet.loads.length)
      return;

    // console.log('linking {' + logloads(linkSet.loads) + '}');
    // snapshot(loader);

    // 15.2.5.3.1 LinkageGroups alternative implementation

    // build all the groups
    // because the first load represents the top of the tree
    // for a given linkset, we can work down from there
    var groups = [];
    var startingLoad = linkSet.loads[0];
    startingLoad.groupIndex = 0;
    buildLinkageGroups(startingLoad, linkSet.loads, groups);

    // determine the kind of the bottom group
    var curGroupDeclarative = startingLoad.isDeclarative == groups.length % 2;

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
          var module = doDynamicExecute(linkSet, load, linkError);
          if (!module)
            return;
          load.module = {
            name: load.name,
            module: module
          };
          load.status = "linked";
        }
        finishLoad(loader, load);
      }

      // alternative current kind for next loop
      curGroupDeclarative = !curGroupDeclarative;
    }
  }


  // custom module records for binding graph
  // store linking module records in a separate table
  function getOrCreateModuleRecord(name, loader) {
    var moduleRecords = loader.moduleRecords;
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      module: new Module(), // start from an empty module and extend
      importers: []
    });
  }

  // custom declarative linking function
  function linkDeclarativeModule(load, loads, loader) {
    if (load.module)
      return;

    var module = load.module = getOrCreateModuleRecord(load.name, loader);
    var moduleObj = load.module.module;

    var registryEntry = load.declare.call(__global, function(name, value) {
      // NB This should be an Object.defineProperty, but that is very slow.
      //    By disaling this module write-protection we gain performance.
      //    It could be useful to allow an option to enable or disable this.
      module.locked = true;
      if(typeof name === "object") {
        for(var p in name) {
          moduleObj[p] = name[p];
        }
      } else {
        moduleObj[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          var importerIndex = indexOf.call(importerModule.dependencies, module);
          importerModule.setters[importerIndex](moduleObj);
        }
      }

      module.locked = false;
      return value;
    });

    // setup our setters and execution function
    module.setters = registryEntry.setters;
    module.execute = registryEntry.execute;

    // now link all the module dependencies
    // amending the depMap as we go
    for (var i = 0, l = load.dependencies.length; i < l; i++) {
      var depName = load.dependencies[i].value;
      var depModule = loader.modules[depName];

      // if dependency not already in the module registry
      // then try and link it now
      if (!depModule) {
        // get the dependency load record
        for (var j = 0; j < loads.length; j++) {
          if (loads[j].name != depName)
            continue;

          // only link if already not already started linking (stops at circular / dynamic)
          if (!loads[j].module) {
            linkDeclarativeModule(loads[j], loads, loader);
            depModule = loads[j].module;
          }
          // if circular, create the module record
          else {
            depModule = getOrCreateModuleRecord(depName, loader);
          }
        }
      }

      // only declarative modules have dynamic bindings
      if (depModule.importers) {
        module.dependencies.push(depModule);
        depModule.importers.push(module);
      }
      else {
        // track dynamic records as null module records as already linked
        module.dependencies.push(null);
      }

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depModule.module);
    }

    load.status = "linked";
  }



  // 15.2.5.5.1 LinkImports not implemented
  // 15.2.5.7 ResolveExportEntries not implemented
  // 15.2.5.8 ResolveExports not implemented
  // 15.2.5.9 ResolveExport not implemented
  // 15.2.5.10 ResolveImportEntries not implemented

  // 15.2.6.1
  function evaluateLoadedModule(loader, load) {
    console.assert(load.status == "linked", "is linked " + load.name);

    doEnsureEvaluated(load.module, [], loader);
    return load.module.module;
  }

  /*
   * Module Object non-exotic for ES5:
   *
   * module.module        bound module object
   * module.execute       execution function for module
   * module.dependencies  list of module objects for dependencies
   * See getOrCreateModuleRecord for all properties
   *
   */
  function doExecute(module, loader) {
    try {
      module.execute.call(__global);
    }
    catch(e) {
      e.onModuleExecution = true;
      cleanupStack(e);
      return e;
    }
  }

  function cleanupStack(err) {
    if (!err.originalErr) {
      var stack = (err.stack || err.message || err).toString().split("\n");
      var newStack = [];
      for (var i = 0; i < stack.length; i++) {
        if (typeof $__curScript == "undefined" || stack[i].indexOf($__curScript.src) == -1)
          newStack.push(stack[i]);
      }

      if(newStack.length) {
        err.stack = newStack.join("\n\t");
      }
    }
    return err;
  }

  // propogate execution errors
  // see https://bugs.ecmascript.org/show_bug.cgi?id=2993
  function doEnsureEvaluated(module, seen, loader) {
    var err = ensureEvaluated(module, seen, loader);
    if (err)
      throw err;
  }
  // 15.2.6.2 EnsureEvaluated adjusted
  function ensureEvaluated(module, seen, loader) {
    if (module.evaluated || !module.dependencies)
      return;

    seen.push(module);

    var deps = module.dependencies;
    var err;

    for (var i = 0, l = deps.length; i < l; i++) {
      var dep = deps[i];
      // dynamic dependencies are empty in module.dependencies
      // as they are already linked
      if (!dep)
        continue;
      if (indexOf.call(seen, dep) == -1) {
        err = ensureEvaluated(dep, seen, loader);
        // stop on error, see https://bugs.ecmascript.org/show_bug.cgi?id=2996
        if (err) {
          err = addToError(err, "Error evaluating " + dep.name + "\n");
          return err;
        }
      }
    }

    if (module.failed)
      return new Error("Module failed execution.");

    if (module.evaluated)
      return;

    module.evaluated = true;
    err = doExecute(module, loader);
    if (err) {
      module.failed = true;
    }
    else if (Object.preventExtensions) {
      // spec variation
      // we don't create a new module here because it was created and ammended
      // we just disable further extensions instead
      Object.preventExtensions(module.module);
    }

    module.execute = undefined;
    return err;
  }

  function addToError(error, msg) {
    var err = error;
    if (err instanceof Error)
      err.message = msg + err.message;
    else
      err = msg + err;
    return err;
  }

  // 26.3 Loader

  // 26.3.1.1
  function Loader(options) {
    if (typeof options != "object")
      throw new TypeError("Options must be an object");

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
      modules: {},
      importPromises: {},
      moduleRecords: {}
    };

    // 26.3.3.6
    // 26.3.3.13 realm not implemented
    defineProperty(this, "global", {
      get: function() {
        return __global;
      }
    });
  }

  function Module() {}

  // importPromises adds ability to import a module twice without error - https://bugs.ecmascript.org/show_bug.cgi?id=2601
  function createImportPromise(loader, name, promise) {
    var importPromises = loader._loader.importPromises;
    return importPromises[name] = promise.then(function(m) {
      importPromises[name] = undefined;
      return m;
    }, function(e) {
      importPromises[name] = undefined;
      throw e;
    });
  }

  Loader.prototype = {
    // 26.3.3.1
    constructor: Loader,
	anonymousCount: 0,
    // 26.3.3.2
    define: function(name, source, options) {
      // check if already defined
      if (this._loader.importPromises[name])
        throw new TypeError("Module is already loading.");
      return createImportPromise(this, name, new Promise(asyncStartLoadPartwayThrough({
        step: "translate",
        loader: this._loader,
        moduleName: name,
        moduleMetadata: options && options.metadata || {},
        moduleSource: source,
        moduleAddress: options && options.address
      })));
    },
    // 26.3.3.3
    "delete": function(name) {
      var loader = this._loader;
      delete loader.importPromises[name];
      delete loader.moduleRecords[name];
      if(this.failed) {
        var load;
        for(var i = 0; i < this.failed.length; i++) {
          load = this.failed[i];
          if(load.name === name) {
            this.failed.splice(i, 1);
            break;
          }
        }
      }
      return loader.modules[name] ? delete loader.modules[name] : false;
    },
    // 26.3.3.4 entries not implemented
    // 26.3.3.5
    get: function(key) {
      if (!this._loader.modules[key])
        return;
      doEnsureEvaluated(this._loader.modules[key], [], this);
      return this._loader.modules[key].module;
    },
    // 26.3.3.7
    has: function(name) {
      return !!this._loader.modules[name];
    },
    // 26.3.3.8
    "import": function(name, options) {
      // run normalize first
      var loaderObj = this;

      // added, see https://bugs.ecmascript.org/show_bug.cgi?id=2659
      return Promise.resolve(loaderObj.normalize(name, options && options.name, options && options.address))
      .then(function(name) {
        var loader = loaderObj._loader;

        if (loader.modules[name]) {
          doEnsureEvaluated(loader.modules[name], [], loader._loader);
          return loader.modules[name].module;
        }

        return loader.importPromises[name] || createImportPromise(loaderObj, name,
          loadModule(loader, name, options || {})
          .then(function(load) {
            delete loader.importPromises[name];
            return evaluateLoadedModule(loader, load);
          })
		  .then(null, function(err){
            if(loaderObj.defined) {
              loaderObj.defined[name] = undefined;
            }

            if(err.onModuleExecution && loaderObj.getModuleLoad) {
              var load = loaderObj.getModuleLoad(name);
              if(load) {
                return loaderObj.rejectWithCodeFrame(err, load);
              }
            } else if(err.promise) {
              return err.promise;
            }

            return Promise.reject(err);
          }));
      });
    },
    // 26.3.3.9 keys not implemented
    // 26.3.3.10
    load: function(name, options) {
      if (this._loader.modules[name]) {
        doEnsureEvaluated(this._loader.modules[name], [], this._loader);
        return Promise.resolve(this._loader.modules[name].module);
      }
      return this._loader.importPromises[name] || createImportPromise(this, name, loadModule(this._loader, name, {}));
    },
    // 26.3.3.11
    module: function(source, options) {
      var name = "<Anonymous" + (++this.anonymousCount) + ">";
      var load = createLoad(name);
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
    // 26.3.3.12
    newModule: function (obj) {
      if (typeof obj != "object")
        throw new TypeError("Expected object");

      // we do this to be able to tell if a module is a module privately in ES5
      // by doing m instanceof Module
      var m = new Module();

      var pNames;
      if (Object.getOwnPropertyNames && obj != null) {
        pNames = Object.getOwnPropertyNames(obj);
      }
      else {
        pNames = [];
        for (var key in obj)
          pNames.push(key);
      }

      for (var i = 0; i < pNames.length; i++) (function(key) {
        defineProperty(m, key, {
          configurable: false,
          enumerable: true,
          get: function () {
            return obj[key];
          }
        });
      })(pNames[i]);

      if (Object.preventExtensions)
        Object.preventExtensions(m);

      return m;
    },
    // 26.3.3.14
    set: function(name, module) {
      if (!(module instanceof Module))
        throw new TypeError("Loader.set(" + name + ", module) must be a module");
      this._loader.modules[name] = {
        module: module
      };
    },
    // 26.3.3.15 values not implemented
    // 26.3.3.16 @@iterator not implemented
    // 26.3.3.17 @@toStringTag not implemented

    // 26.3.3.18.1
    normalize: function(name, referrerName, referrerAddress) {
      return name;
    },
    // 26.3.3.18.2
    locate: function(load) {
      return load.name;
    },
    // 26.3.3.18.3
    fetch: function(load) {
      throw new TypeError("Fetch not implemented");
    },
    // 26.3.3.18.4
    translate: function(load) {
      return load.source;
    },
    // 26.3.3.18.5
    instantiate: function(load) {},
    notifyLoad: function(specifier, name, parentName) {},
	provide: function(name, source, options) {
      var load;
      for(var i = 0; i < this._loader.loads.length; i++) {
        if(this._loader.loads[i].name === name) {
          load = this._loader.loads[i];
          break;
        }
      }

      if(load) {
        incrementPass(load);
        changeLoadingStatus(load, "loading");
        return proceedToTranslate(this._loader, load, Promise.resolve(source));
      } else {
        this["delete"](name);
      }

      return this.define(name, source, options);
    }
  };

  var _newModule = Loader.prototype.newModule;

  if (typeof exports === "object")
    module.exports = Loader;

  __global.Reflect = __global.Reflect || {};
  __global.Reflect.Loader = __global.Reflect.Loader || Loader;
  __global.Reflect.global = __global.Reflect.global || __global;
  __global.LoaderPolyfill = Loader;
})();
(function(Loader) {
    var g = __global;

    var isNode = typeof self === "undefined" &&
		typeof process !== "undefined" &&
		{}.toString.call(process) === "[object process]";

    function getTranspilerModule(loader, globalName) {
        return loader.newModule({
			__useDefault: true,
			"default": g[globalName]
		});
    }

    function getTranspilerGlobalName(loadName) {
        return loadName === "babel" ? "Babel" : loadName;
    }

    // Use Babel by default
    Loader.prototype.transpiler = "babel";

    Loader.prototype.transpile = function(load) {
        var self = this;

        // pick up Transpiler modules from existing globals on first run if set
        if (!self.transpilerHasRun) {
            if (g.traceur && !self.has("traceur")) {
                self.set("traceur", getTranspilerModule(self, "traceur"));
            }
            if (g.Babel && !self.has("babel")) {
                self.set("babel", getTranspilerModule(self, "Babel"));
            }
            self.transpilerHasRun = true;
        }

        return self["import"](self.transpiler)
			.then(function(transpilerMod) {
            var transpiler = transpilerMod;
            if (transpiler.__useDefault) {
                transpiler = transpiler["default"];
            }

            return (transpiler.Compiler ? traceurTranspile : babelTranspile)
                .call(self, load, transpiler);
        })
			.then(function(code) {
            return "var __moduleAddress = \"" + load.address + "\";" + code;
        });
    };

    Loader.prototype.instantiate = function(load) {
        var self = this;
        return Promise.resolve(self.normalize(self.transpiler))
			.then(function(transpilerNormalized) {
            // load transpiler as a global (avoiding System clobbering)
            if (load.name === transpilerNormalized) {
                return {
                    deps: [],
                    execute: function() {
                        var curSystem = g.System;
                        var curLoader = g.Reflect.Loader;
                        // ensure not detected as CommonJS
                        __eval("(function(require,exports,module){" + load.source + "})();", g, load);
                        g.System = curSystem;
                        g.Reflect.Loader = curLoader;
                        return getTranspilerModule(self, getTranspilerGlobalName(load.name));
                    }
                };
            }
        });
    };

    function traceurTranspile(load, traceur) {
        var options = this.traceurOptions || {};
        options.modules = "instantiate";
        options.script = false;
        options.sourceMaps = "inline";
        options.filename = load.address;
        options.inputSourceMap = load.metadata.sourceMap;
        options.moduleName = false;

        var compiler = new traceur.Compiler(options);
        var source = doTraceurCompile(load.source, compiler, options.filename);

        // add "!eval" to end of Traceur sourceURL
        // I believe this does something?
        source += "!eval";

        return source;
    }
    function doTraceurCompile(source, compiler, filename) {
        try {
            return compiler.compile(source, filename);
        }
		catch(e) {
            throw e[0];
        }
    }

    /**
     * Gets the babel environment name
     * return {string} The babel environment name
     */
    function getBabelEnv() {
        var loader = this;
        var defaultEnv = "development";
        var loaderEnv = typeof loader.getEnv === "function" && loader.getEnv();

        if (isNode) {
            return process.env.BABEL_ENV ||
				process.env.NODE_ENV ||
				loaderEnv ||
				defaultEnv;
        }
		else {
            return loaderEnv || defaultEnv;
        }
    }

    /**
     * Gets the babel preset or plugin name
     * @param {BabelPreset|BabelPlugin} presetOrPlugin A babel plugin or preset
     * @return {?string} The preset/plugin name
     */
    function getPresetOrPluginName(presetOrPlugin) {
        if (includesPresetOrPluginName(presetOrPlugin)) {
            return typeof presetOrPlugin === "string" ? presetOrPlugin : presetOrPlugin[0];
        }
		else {
            return null;
        }
    }

    /**
     * Whether the babel plugin/preset name was provided
     *
     * @param {BabelPreset|BabelPlugin} presetOrPlugin
     * @return {boolean}
     */
    function includesPresetOrPluginName(presetOrPlugin) {
        return typeof presetOrPlugin === "string" ||
			presetOrPlugin.length && typeof presetOrPlugin[0] === "string";
    }

    /**
     * A Babel plugins as defined in `babelOptions.plugins`
     * @typedef {string|Function|<string, Object>[]|<Function, Object>[]} BabelPlugin
     */

    var processBabelPlugins = (function() {
        /**
         * Returns a list of babel plugins to be used during transpilation
         *
         * Collects the babel plugins defined in `babelOptions.plugins` plus
         * the environment dependant plugins.
         *
         * @param {Object} babel The babel object exported by babel-standalone
         * @param {babelOptions} babelOptions The babel configuration object
         * @return {Promise.<BabelPlugin[]>} Promise that resolves to a list of babel plugins
         */
        return function processBabelPlugins(babel, babelOptions) {
            var babelEnv = getBabelEnv.call(this);
            var babelEnvConfig = babelOptions.env || {};

            var pluginsPromises = [
				doProcessPlugins.call(this, babel, babelOptions.plugins)
			];

            for (var envName in babelEnvConfig) {
                // do not process plugins if the current environment does not match
                // the environment in which the plugins are set to be used
                if (babelEnv === envName) {
                    var plugins = babelEnvConfig[envName].plugins || [];
                    pluginsPromises.push(doProcessPlugins.call(this, babel, plugins));
                }
            }

            return Promise.all(pluginsPromises)
				.then(function(results) {
                var plugins = [];

                // results is an array of arrays, flatten it out!
                results.forEach(function(processedPlugins) {
                    plugins = plugins.concat(processedPlugins);
                });

                return plugins;
            });
        }

        /**
         * Collects builtin plugin names and non builtins functions
         *
         * @param {Object} babel The babel object exported by babel-standalone
         * @param {BabelPlugin[]} babelPlugins A list of babel plugins
         * @return {Promise.<BabelPlugin[]>} A promise that resolves to a list
         *		of babel-standalone builtin plugin names and non-builtin plugin
         *		functions
         */
        function doProcessPlugins(babel, babelPlugins) {
            var promises = [];

            var plugins = babelPlugins || [];

            plugins.forEach(function(plugin) {
                var name = getPresetOrPluginName(plugin);

                if (!includesPresetOrPluginName(plugin) || isBuiltinPlugin(babel, name)) {
                    promises.push(plugin);
                }
				else if (!isBuiltinPlugin(babel, name)) {
                    var parent = this.configMain || "package.json!npm";
                    var npmPluginNameOrPath = getNpmPluginNameOrPath(name);

                    // import the plugin!
                    promises.push(this["import"](npmPluginNameOrPath, { name: parent })
						.then(function(mod) {
                        var exported = mod.__esModule ? mod["default"] : mod;

                        if (typeof plugin === "string") {
                            return exported;
                        }
                        // assume the array form was provided
                        else {
                            // [ pluginFunction, pluginOptions ]
                            return [exported, plugin[1]];
                        }
                    }));
                }
            }, this);

            return Promise.all(promises);
        }

        /**
         * Whether the plugin is built in babel-standalone
         *
         * @param {Object} babel The babel object exported by babel-standalone
         * @param {string} pluginName The plugin name to be checked
         * @return {boolean}
         */
        function isBuiltinPlugin(babel, pluginName) {
            var isNpmPluginName = /^(?:babel-plugin-)/;
            var availablePlugins = babel.availablePlugins || {};

            // babel-standalone registers its bundled plugins using the shorthand name
            var shorthand = isNpmPluginName.test(pluginName) ?
				pluginName.replace("babel-plugin-", "") :
				pluginName;

            return !!availablePlugins[shorthand];
        }

        /**
         * Returns babel full plugin name if shorthand was used or the path provided
         *
         * @param {string} name The entry in the plugin array
         * @return {string} Relative/absolute path to plugin or babel npm plugin name
         *
         * If a babel plugin is on npm, it can be set in the `plugins` array using
         * one of the following forms:
         *
         * 1) full plugin name, e.g `"plugins": ["babel-plugin-myPlugin"]`
         * 2) relative/absolute path, e.g: `"plugins": ["./node_modules/asdf/plugin"]`
         * 3) using a shorthand, e.g: `"plugins": ["myPlugin"]`
         *
         * Since plugins are loaded through steal, we need to make sure the full
         * plugin name is passed to `steal.import` so the npm extension can locate
         * the babel plugin. Relative/absolute paths should be loaded as any other
         * module.
         */
        function getNpmPluginNameOrPath(name) {
            var isPath = /\//;
            var isBabelPluginName = /^(?:babel-plugin-)/;

            return isPath.test(name) || isBabelPluginName.test(name) ?
				name : "babel-plugin-" + name;
        }
    }());

    function getBabelPlugins(current) {
        var plugins = current || [];
        var required = "transform-es2015-modules-systemjs";

        if (plugins.indexOf(required) === -1) {
            plugins.unshift(required);
        }

        return plugins;
    }

    var babelES2015Preset = "es2015-no-commonjs";

    function getBabelPresets(current, loader) {
        var presets = current || [];
        var forceES5 = loader.forceES5 !== false;
        var defaultPresets = forceES5 
			? [babelES2015Preset, "react", "stage-0"]
			: ["react"];

        // if the user provided a list of presets to be used, treat the
        // BABEL_ES2015_PRESET as required if stealCondig.forceES5 is `true`
        if (presets.length) {
            if (forceES5) {
                if (presets.indexOf(babelES2015Preset) != -1) {
                    presets.unshift(babelES2015Preset);
                }
            }
        }

        return presets.length ? presets : defaultPresets;
    }

    function getBabelOptionsFromLoad(load) {
        var pkg = load.metadata.npmPackage;
        if(pkg) {
            var steal = pkg.steal || pkg.system;
            if(steal && steal.babelOptions) {
                return steal.babelOptions;
            }
        }
        return this.babelOptions || {};
    }

    /**
     * Returns the babel version
     * @param {Object} babel The babel object
     * @return {number} The babel version
     */
    function getBabelVersion(babel) {
        var babelVersion = babel.version ? +babel.version.split(".")[0] : 6;

        return babelVersion || 6;
    }

    function getBabelOptions(load, babel) {
        var loader = this;
        var options = getBabelOptionsFromLoad.call(loader, load);

        options.sourceMap = "inline";
        options.filename = load.address;
        options.code = true;
        options.ast = false;

        if (getBabelVersion(babel) >= 6) {
            // delete the old babel options if they are present in config
            delete options.optional;
            delete options.whitelist;
            delete options.blacklist;

            // make sure presents and plugins needed for Steal to work
            // correctly are set
            options.presets = getBabelPresets(options.presets, loader);
            options.plugins = getBabelPlugins(options.plugins);
        }
		else {
            options.modules = "system";

            if (!options.blacklist) {
                options.blacklist = ["react"];
            }
        }

        return options;
    }

    /**presets
     * A Babel preset as defined in `babelOptions.presets`
     * @typedef {string|Function|Object|<string, Object>[]|<Function, Object>[]|<Object, Object>} BabelPreset
     */

    var processBabelPresets = (function() {
        /**
         * Returns a list of babel presets to be used during transpilation
         *
         * Collects the babel presets defined in `babelOptions.presets` plus
         * the environment dependant presets.
         *
         * @param {Object} babel The babel object exported by babel-standalone
         * @param {babelOptions} babelOptions The babel configuration object
         * @return {Promise.<BabelPreset[]>} Promise that resolves to a list of babel presets
         */
        return function processBabelPresets(babel, babelOptions) {
            var babelEnv = getBabelEnv.call(this);
            var babelEnvConfig = babelOptions.env || {};

            var presetsPromises = [
				doProcessPresets.call(this, babel, babelOptions.presets)
			];

            for (var envName in babelEnvConfig) {
                // do not process presets if the current environment does not match
                // the environment in which the presets are set to be used
                if (babelEnv === envName) {
                    var presets = babelEnvConfig[envName].presets || [];
                    presetsPromises.push(doProcessPresets.call(this, babel, presets));
                }
            }

            return Promise.all(presetsPromises)
				.then(function(results) {
                var presets = [];

                // results is an array of arrays, flatten it out!
                results.forEach(function(processedPresets) {
                    presets = presets.concat(processedPresets);
                });

                return presets;
            });
        };

        /**
         * Collects builtin presets names and non builtins objects/functions
         *
         * @param {Object} babel The babel object exported by babel-standalone
         * @param {BabelPreset[]} babelPresets A list of babel presets
         * @return {Promise.<BabelPreset[]>} A promise that resolves to a list
         *		of babel-standalone builtin preset names and non-builtin preset
         *		definitions (object or function).
         */
        function doProcessPresets(babel, babelPresets) {
            var promises = [];
            var presets = babelPresets || [];

            presets.forEach(function(preset) {
                var name = getPresetOrPluginName(preset);

                if (!includesPresetOrPluginName(preset) || isBuiltinPreset(babel, name)) {
                    promises.push(preset);
                }
				else if (!isBuiltinPreset(babel, name)) {
                    var parent = this.configMain || "package.json!npm";
                    var npmPresetNameOrPath = getNpmPresetNameOrPath(name);

                    // import the preset!
                    promises.push(this["import"](npmPresetNameOrPath, { name: parent })
						.then(function(mod) {
                        var exported = mod.__esModule ? mod["default"] : mod;

                        if (typeof preset === "string") {
                            return exported;
                        }
                        // assume the array form was provided
                        else {
                            // [ presetDefinition, presetOptions ]
                            return [exported, preset[1]];
                        }
                    }));
                }
            }, this);

            return Promise.all(promises);
        }

        /**
         * Whether the preset is built in babel-standalone
         * @param {Object} babel The babel object exported by babel-standalone
         * @param {string} pluginName The plugin name to be checked
         * @return {boolean}
         */
        function isBuiltinPreset(babel, presetName) {
            var isNpmPresetName = /^(?:babel-preset-)/;
            var availablePresets = babel.availablePresets || {};

            // babel-standalone registers its builtin presets using the shorthand name
            var shorthand = isNpmPresetName.test(presetName) ?
				presetName.replace("babel-preset-", "") :
				presetName;

            return !!availablePresets[shorthand];
        }

        function getNpmPresetNameOrPath(name) {
            var isPath = /\//;
            var isNpmPresetName = /^(?:babel-preset-)/;

            if (!isPath.test(name) && !isNpmPresetName.test(name)) {
                return "babel-preset-" + name;
            }

            return name;
        }
    }());

    /**
     * Babel plugin that sets `__esModule` to true
     *
     * This flag is needed to interop the SystemJS format used by steal on the
     * browser in development with the CJS format used for built modules.
     *
     * With dev bundles is possible to load a part of the app already built while
     * other modules are being transpiled on the fly, with this flag, transpiled
     * amd modules will be able to load the modules transpiled on the browser.
     */
    function addESModuleFlagPlugin(babel) {
        var t = babel.types;

        return {
			visitor: {
				Program: function(path, state) {
                    path.unshiftContainer("body", [
						t.exportNamedDeclaration(null, [
							t.exportSpecifier(t.identifier("true"),
								t.identifier("__esModule"))
						])
					]);
                }
			}
		};
    }

    function getImportSpecifierPositionsPlugin(load) {
        load.metadata.importSpecifiers = Object.create(null);
        load.metadata.importNames = Object.create(null);
        load.metadata.exportNames = Object.create(null);

        return {
			visitor: {
				ImportDeclaration: function(path, state){
                    var node = path.node;
                    var specifier = node.source.value;
                    var loc = node.source.loc;
                    load.metadata.importSpecifiers[specifier] = loc;

                    var specifiers = load.metadata.importNames[specifier];
                    if(!specifiers) {
                        specifiers = load.metadata.importNames[specifier] = [];
                    }

                    specifiers.push.apply(specifiers, (
						(node.specifiers || [])
					).map(function(spec) {
                        if(spec.type === "ImportDefaultSpecifier") {
                            return "default";
                        }
                        return spec.imported && spec.imported.name;
                    }));
                },
				ExportDeclaration: function(path, state){
                    var node = path.node;

                    if(node.source) {
                        var specifier = node.source.value;
                        var specifiers = load.metadata.exportNames[specifier];

                        if(node.type === "ExportNamedDeclaration") {
                            if(!specifiers) {
                                specifiers = load.metadata.exportNames[specifier] = new Map();
                            }

                            node.specifiers.forEach(function(node){
                                specifiers.set(node.exported.name, node.local.name);
                            });
                        } else if(node.type === "ExportAllDeclaration") {
                            // TODO Not sure what to do here.
                            load.metadata.exportNames[specifier] = 1;
                        }
                    }
                }
			}
		};
    }

    Loader.prototype._getImportSpecifierPositionsPlugin = getImportSpecifierPositionsPlugin;

    function babelTranspile(load, babelMod) {
        var loader = this;
        var babel = babelMod.Babel || babelMod.babel || babelMod;

        var babelVersion = getBabelVersion(babel);
        var options = getBabelOptions.call(loader, load, babel);

        return Promise.all([
			processBabelPlugins.call(this, babel, options),
			processBabelPresets.call(this, babel, options)
		])
		.then(function(results) {
            // might be running on an old babel that throws if there is a
            // plugins array in the options object
            if (babelVersion >= 6) {
                options.plugins = [
					getImportSpecifierPositionsPlugin.bind(null, load),
					addESModuleFlagPlugin
				].concat(results[0]);
                options.presets = results[1];
            }

            try {
                var result = babel.transform(load.source, options);
                var source = result.code;

                // add "!eval" to end of Babel sourceURL
                // I believe this does something?
                return source + "\n//# sourceURL=" + load.address + "!eval";
            } catch(ex) {
                if(ex instanceof SyntaxError) {
                    var newError = new SyntaxError(ex.message);
                    var stack = new loader.StackTrace(ex.message, [
						loader.StackTrace.item("", load.address,
							ex.loc.line, ex.loc.column)
					]);
                    newError.stack = stack.toString();
                    return Promise.reject(newError);
                }
                return Promise.reject(ex);
            }
        });
    }
})(__global.LoaderPolyfill);

(function() {
  var isWindows = typeof process != "undefined" && !!process.platform.match(/^win/);
  var Promise = __global.Promise || require("when/es6-shim/Promise");

  // Helpers
  // Absolute URL parsing, from https://gist.github.com/Yaffle/1088850
  function parseURI(url) {
    var m = String(url).replace(/^\s+|\s+$/g, "").match(/^([^:\/?#]+:)?(\/\/(?:[^:@\/?#]*(?::[^:@\/?#]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
    // authority = '//' + user + ':' + pass '@' + hostname + ':' port
    return (m ? {
      href: m[0] || "",
      protocol: m[1] || "",
      authority: m[2] || "",
      host: m[3] || "",
      hostname: m[4] || "",
      port: m[5] || "",
      pathname: m[6] || "",
      search: m[7] || "",
      hash: m[8] || ""
    } : null);
  }
  function removeDotSegments(input) {
    var output = [];
    input.replace(/^(\.\.?(\/|$))+/, "")
      .replace(/\/(\.(\/|$))+/g, "/")
      .replace(/\/\.\.$/, "/../")
      .replace(/\/?[^\/]*/g, function (p) {
      if (p === "/..")
        output.pop();
      else
        output.push(p);
    });
    return output.join("").replace(/^\//, input.charAt(0) === "/" ? "/" : "");
  }
  var doubleSlash = /^\/\//;
  function toAbsoluteURL(inBase, inHref) {
    var href = inHref;
    var base = inBase;

    if(doubleSlash.test(inHref)) {
      // Default to http
      return "http:" + inHref;
    }

    if (isWindows)
      href = href.replace(/\\/g, "/");

    href = parseURI(href || "");
    base = parseURI(base || "");

    return !href || !base ? null : (href.protocol || base.protocol) +
      (href.protocol || href.authority ? href.authority : base.authority) +
      removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === "/" ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? "/" : "") + base.pathname.slice(0, base.pathname.lastIndexOf("/") + 1) + href.pathname) : base.pathname)) +
      (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
      href.hash;
  }

  var fetchTextFromURL;
  if (typeof XMLHttpRequest != "undefined") {
    fetchTextFromURL = function(url, fulfill, reject) {
      var xhr = new XMLHttpRequest();
      var sameDomain = true;
      var doTimeout = false;
      if (!("withCredentials" in xhr)) {
        // check if same domain
        var domainCheck = /^(\w+:)?\/\/([^\/]+)/.exec(url);
        if (domainCheck) {
          sameDomain = domainCheck[2] === window.location.host;
          if (domainCheck[1])
            sameDomain &= domainCheck[1] === window.location.protocol;
        }
      }
      if (!sameDomain && typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.onload = load;
        xhr.onerror = error;
        xhr.ontimeout = error;
        xhr.onprogress = function() {};
        xhr.timeout = 0;
        doTimeout = true;
      }
      function load() {
        fulfill(xhr.responseText);
      }
      function error() {
        var s = xhr.status;
        var msg = s + " " + xhr.statusText + ": " + url + "\n" || "XHR error";
        var err = new Error(msg);
        err.url = url;
        err.statusCode = s;
        reject(err);
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

      if (doTimeout)
        setTimeout(function() {
          xhr.send();
        }, 0);

      xhr.send(null);
    }
  }
  else if (typeof require != "undefined") {
    var fs, http, https, fourOhFourFS = /ENOENT/;
    fetchTextFromURL = function(rawUrl, fulfill, reject) {
      if (rawUrl.substr(0, 5) === "file:") {
        fs = fs || require("fs");
        var url = rawUrl.substr(5);
        if (isWindows)
          url = url.replace(/\//g, "\\");
        return fs.readFile(url, function(err, data) {
          if (err) {
            // Mark this error as a 404, so that the npm extension
            // will know to retry.
            if(fourOhFourFS.test(err.message)) {
              err.statusCode = 404;
              err.url = rawUrl;
            }

            return reject(err);
          } else {
            fulfill(data + "");
          }
        });
      } else if(rawUrl.substr(0, 4) === "http") {
        var h;
        if(rawUrl.substr(0, 6) === "https:") {
          h = https = https || require("https");
        } else {
          h = http = http || require("http");
        }
        return h.get(rawUrl, function(res) {
          if(res.statusCode !== 200) {
            reject(new Error("Request failed. Status: " + res.statusCode));
          } else {
            var rawData = "";
            res.setEncoding("utf8");
            res.on("data", function(chunk) {
              rawData += chunk;
            });
            res.on("end", function(){
              fulfill(rawData);
            });
          }
        });
      }
    }
  }
  else if(typeof fetch === "function") {
    fetchTextFromURL = function(url, fulfill, reject) {
      fetch(url).then(function(resp){
        return resp.text();
      }).then(function(text){
        fulfill(text);
      }).then(null, function(err){
        reject(err);
      });
    }
  }
  else {
    throw new TypeError("No environment fetch API available.");
  }

  function transformError(err, load, loader) {
    if(typeof loader.getDependants === "undefined") {
      return Promise.resolve();
    }
    var dependants = loader.getDependants(load.name);
    if(Array.isArray(dependants) && dependants.length) {
      var StackTrace = loader.StackTrace;
      var isProd = loader.isEnv("production");

      return Promise.resolve()
      .then(function(){
        return isProd ? Promise.resolve() : loader["import"]("@@babel-code-frame");
      })
      .then(function(codeFrame){
        var parentLoad = loader.getModuleLoad(dependants[0]);
        var pos = loader.getImportSpecifier(load.name, parentLoad) || {
            line: 1, column: 0
        };

        var detail = "The module [" + loader.prettyName(load) + "] couldn't be fetched.\n" +
          "Clicking the link in the stack trace below takes you to the import.\n" +
          "See https://stealjs.com/docs/StealJS.error-messages.html#404-not-found for more information.\n";
        var msg = err.message + "\n" + detail;

        if(!isProd) {
          var src = parentLoad.metadata.originalSource || parentLoad.source;
          var codeSample = codeFrame(src, pos.line, pos.column);
          msg += "\n" + codeSample + "\n";
        }

        err.message = msg;

        var stackTrace = new StackTrace(msg, [
            StackTrace.item(null, parentLoad.address, pos.line, pos.column)
        ]);

        err.stack = stackTrace.toString();
      });
    }
    return Promise.resolve();
  }

  var SystemLoader = function($__super) {
    "use strict";

    function SystemLoader(options) {
      $__super.call(this, options || {});

      // Set default baseURL and paths
      if (typeof location != "undefined" && location.href) {
        var href = __global.location.href.split("#")[0].split("?")[0];
        this.baseURL = href.substring(0, href.lastIndexOf("/") + 1);
      }
      else if (typeof process != "undefined" && process.cwd) {
        this.baseURL = "file:" + process.cwd() + "/";
        if (isWindows)
          this.baseURL = this.baseURL.replace(/\\/g, "/");
      }
      else {
        throw new TypeError("No environment baseURL");
      }
      this.paths = { "*": "*.js" };
    }

    SystemLoader.__proto__ = ($__super !== null ? $__super : Function.prototype);
    SystemLoader.prototype = $__Object$create(($__super !== null ? $__super.prototype : null));

    $__Object$defineProperty0(SystemLoader.prototype, "constructor", {
      value: SystemLoader
    });

    $__Object$defineProperties(SystemLoader.prototype, {
      global: {
        get: function() {
          return isBrowser ? window : (isWorker ? self : __global);
        },

        enumerable: true,
        configurable: true
      },

      strict: {
        get: function() {
          return true;
        },

        enumerable: true,
        configurable: true
      },

      normalize: {
        value: function(name, parentName, parentAddress) {
          if (typeof name != "string")
            throw new TypeError("Module name must be a string");

          var segments = name.split("/");

          if (segments.length == 0)
            throw new TypeError("No module name provided");

          // current segment
          var i = 0;
          // is the module name relative
          var rel = false;
          // number of backtracking segments
          var dotdots = 0;
          if (segments[0] == ".") {
            i++;
            if (i == segments.length)
              throw new TypeError("Illegal module name \"" + name + "\"");
            rel = true;
          }
          else {
            while (segments[i] == "..") {
              i++;
              if (i == segments.length)
                throw new TypeError("Illegal module name \"" + name + "\"");
            }
            if (i)
              rel = true;
            dotdots = i;
          }

          /*for (var j = i; j < segments.length; j++) {
            var segment = segments[j];
            if (segment == '' || segment == '.' || segment == '..')
              throw new TypeError('Illegal module name "' + name + '"');
          }*/

          if (!rel)
            return name;

          // build the full module name
          var normalizedParts = [];
          var parentParts = (parentName || "").split("/");
          var normalizedLen = parentParts.length - 1 - dotdots;

          normalizedParts = normalizedParts.concat(parentParts.splice(0, parentParts.length - 1 - dotdots));
          normalizedParts = normalizedParts.concat(segments.splice(i, segments.length - i));

          return normalizedParts.join("/");
        },

        enumerable: false,
        writable: true
      },

      locate: {
        value: function(load) {
          var name = load.name;

          // NB no specification provided for System.paths, used ideas discussed in https://github.com/jorendorff/js-loaders/issues/25

          // most specific (longest) match wins
          var pathMatch = "", wildcard;

          // check to see if we have a paths entry
          for (var p in this.paths) {
            var pathParts = p.split("*");
            if (pathParts.length > 2)
              throw new TypeError("Only one wildcard in a path is permitted");

            // exact path match
            if (pathParts.length == 1) {
              if (name == p && p.length > pathMatch.length) {
                pathMatch = p;
                break;
              }
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
            outPath = outPath.replace("*", wildcard);

          // percent encode just '#' in module names
          // according to https://github.com/jorendorff/js-loaders/blob/master/browser-loader.js#L238
          // we should encode everything, but it breaks for servers that don't expect it
          // like in (https://github.com/systemjs/systemjs/issues/168)
          if (isBrowser)
            outPath = outPath.replace(/#/g, "%23");

          return toAbsoluteURL(this.baseURL, outPath);
        },

        enumerable: false,
        writable: true
      },

      fetch: {
        value: function(load) {
          var self = this;
          return new Promise(function(resolve, reject) {
            function onError(err) {
              var r = reject.bind(null, err);
              transformError(err, load, self)
              .then(r, r);
            }

            fetchTextFromURL(toAbsoluteURL(self.baseURL, load.address), function(source) {
              resolve(source);
            }, onError);
          });
        },

        enumerable: false,
        writable: true
      }
    });

    return SystemLoader;
  }(__global.LoaderPolyfill);

  var System = new SystemLoader();

  // note we have to export before runing "init" below
  if (typeof exports === "object")
    module.exports = System;

  __global.System = System;
})();
//# sourceMappingURL=loadesr-esnext.js.map


// Define our eval outside of the scope of any other reference defined in this
// file to avoid adding those references to the evaluation scope.
function __eval(__source, __global, __load) {
  try {
    eval('(function() { var __moduleName = "' + (__load.name || '').replace('"', '\"') + '"; ' + __source + ' \n }).call(__global);');
  }
  catch(e) {
    if (e.name == 'SyntaxError' || e.name == 'TypeError')
      e.message = 'Evaluating ' + (__load.name || load.address) + '\n\t' + e.message;
    throw e;
  }
}

})(typeof window != 'undefined' ? window : (typeof WorkerGlobalScope != 'undefined' ?
                                           self : global));
