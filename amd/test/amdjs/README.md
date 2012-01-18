# AMD Tests

A set of Asynchronous Module Definition
[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) compliance
tests.

Right now the tests only run in the browser, but it will be possible to run
them in Node and Rhino.

# Configuration

An implementation needs to have the following two files in the **impl** directory:

* AMD loader implementation
* configure script

The configure script should define the following global variables:

* **config**: a function that accepts configuration parameters. Similar to the
RequireJS form of require({}).

* **go**: a function that implements the top level, global function that starts
loading of modules. Equivalent to the RequireJS global require([], function(){})
signature.

* implemented: an object whose properties are the types of tests that the
loader expects to pass.

# Test Types

Each test type builds on the other: supporting later test types implies support
for earlier test types.

## basic

Very basic loading of named modules that have dependency arrays.

* Support for define.amd to indicate an AMD loader.
* Named modules.
* Dependency arrays.
* Circular dependency support via the "exports" and "require" dependency.
* Test for the CommonJS "module" dependency.

## require

Basic require() support, in accordance with the [amdjs require API](https://github.com/amdjs/amdjs-api/wiki/require):

* require(String)
* require(Array, Function)
* require.toUrl(String)

## anon

Similar tests to **basic**, but using anonymous modules.

## funcString

Tests parsing of definition functions via Function.prototype.toString() to
get out dependencies. Used to support simplified CommonJS module wrapping:

```javascript
    define(function (require) {
        var a = require('a');
        //Return the module definition.
        return {};
    });
```

## namedWrapped

Similar to the **funcString** tests, but using named modules.

```javascript
    define('some/module', function (require) {
        var a = require('a');
        //Return the module definition.
        return {};
    });
```

## plugins

Support for loader plugins.

* Calling the same plugin resource twice and getting the same value.
* Testing a plugin that implements normalize().
* Testing a plugin that uses load.fromText().

## pluginDynamic

Support for loader plugins that use dynamic: true to indicate their resources
should not be cached by the loader. Instead the loader should call the plugin's
load() method for each instance of a dependency that can be loaded by the plugin.

# Running the tests

Run the tests through a web server. The URL should look like the following:

    http://127.0.0.1/amdjs-tests/tests/doh/runner.html?config=path/to/config.js&impl=path/to/loader.js

Where both the config and impl paths are paths that are inside the **impl** directory in this project.

To run the tests using the version of RequireJS in this repository:

    http://127.0.0.1/amdjs-tests/tests/doh/runner.html?config=requirejs/config.js&impl=requirejs/require.js

Or, use the **start.html** page for a page of quick links to start testing.
