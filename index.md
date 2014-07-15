---
layout: default
title: StealJS
version: 0.2.0
downloadUrl: http://canjs.us/release/1.1.5
---

# Good artists copy; great artists steal.

StealJS is a client module loader and builder that will
help you create the next great app. Its designed to simplify 
dependency management while being extremely powerful and flexible.

Its client loader, [steal](https://github.com/bitovi/steal), supports 
the future - [ES6 Module Loader](https://github.com/ModuleLoader/es6-module-loader) syntax -
with everything [traceur supports](https://github.com/google/traceur-compiler/wiki/LanguageFeatures),
while supporting AMD, and CommonJS.

Steal makes common use cases as simply as possible. Steal automatically
loads a config file, supports css and less, and can load plugins by 
extension (no more `!less` in `styles.less!less`).

Its builder, [steal-tools](https://github.com/bitovi/steal-tools), 
lets you build an application or export your project to AMD, 
CommonJS or standalone formats. But steal-tools 
killer feature, it can build progressively loaded apps that 
balance caching and the number of script requests, resulting
in lightening fast load times.




## Steal

### Syntaxes

#### Steal

If you used the old Steal you're already familiar with this syntax, and it works the same in the new version. List all of your dependencies as regular arguments to `steal` and the last argument is a function to be called to define the module's value after all of the dependencies have been loaded:

    steal("can", "underscore", "some_module", function(can, _, myModule){
      return can.Component.extend({
       
      });
    });

Steal differs from other syntaxes in one key way, when specifying dependencies, the module ids point to a folder with the pattern of `folder/folder.js`. In the above example `can` will look for the module at `can/can.js`.

#### AMD

AMD is similar to Steal in that you define a module using a wrapper function. Unlike Steal modules are defined as an array, like so:

    define(["can/can", "underscore/underscore", "some_module/some_module"], function(can, _, myModule){
      return can.Component.extend({

      });
    });

Also like Steal, with AMD you define the module's definition by returning a value from the function body. AMD differs in that the module ids you pass in the dependency array must point to a single file, not a folder.

AMD also provides a conventient syntax that can be used rather than providing a dependency array that mimics CommonJS:

    define(function(require, exports, module){
      var can = require("can/can");
			var _ = require("underscore/underscore");
			var myModule = require("my_module/my_module");

			return ...
    });

#### CommonJS

CommonJS is a popular format used in Node.js, but has also caught on in the browser. People like CommonJS because it doesn't require a wrapper function. You might define a module like so:

    var can = require("can");
    var _ = require("underscore");
    var myModule = require("some_module/some_module");

    module.exports = can.Component.extend({

    });

With CommonJS a single file will always define a single module. In includes 3 key objects, `require`, `exports`, and `module`.

**require** is used to import modules as dependencies. In the above example, `can` is being imported using require.

**exports** is an object that can be used to attach properties to the exported module definition.

**module** is an object representing the module definition. You'll often use either `exports` or `module`. Usually module is used when you want to export a single value, like a function.

#### ES6

The ES6 syntax in the module syntax that will be part of the EMCAScript 6 standard currently in development. Because ES6 syntax is not valid in ES5 it requires compilation to use. Steal brings along Traceur to act as the ES6 compiler, which it does on the fly. When developing you won't even notice that it is loaded, and when built your modules are compiled down to ES5.

ES6 uses the keywords `import` and `export` for importing and exporting respectively. For example:

    import can from "can";

This will import `can` from the can module, assuming it is the default exported value. If a module exports several values you can specify which to import using curl braces. Take an example of a Math module that exports several functions to do operations, it might be defined like so:

    export function add(a, b) {
      return a + b;
    }

    export function subtract(a, b) {
      return a - b;
    }

To import one or more of these exported values use curl braces in your module like so:

    import { add, subtract } from "math";

You can export any type of value, like a normal var:

    export var foo = "bar";

If you want to export a single value you can do so using the `default` keyword like so:

    export default function add(a, b){
      return a + b;
    }

Because Traceur is a full ES6 to ES5 compiler you can use many ES6 features beyond just module loading. Listing these is beyond the scope of this document, but you can check out many of the language features Traceur supports [here](https://github.com/google/traceur-compiler/wiki/LanguageFeatures).

### Config Options

#### map

**Map** provides a way to map a module id to a different module id. This is useful in cases where you have many implementations of a module and want to specify which to use. For example:

    map: {
      "can/util", "can/util/jquery"
    }

This tells steal that when a module asks for `can/util` to give it `can/util/query`.

#### paths

**Paths** is used to specify where a module's JavaScript code can be found. This is useful to translate a short module id into which file represents it:

    paths: {
      "my_module": "path/to/my_module.js"
    }

With paths you can also specify submodules. For example, if importing anything under `can/` you can map that to where Can is installed within your bower components folder like so:

    paths: {
      "can/*": "bower_components/canjs/steal/canjs/*.js"
    }

Note that the old Steal had this same functionality but it is slightly different now. The [migration section](#paths_2) explains the difference.

#### ext

**Ext** is used to map a file extension to a plugin that is used to load it, like so:

    ext: {
     "stache": "canjs/view/stache/system.js"
    }

#### main

The main module to load as your application's entry point. Usually this will be specified as a `data-` option in the script tag that loads Steal.

#### bundles

An array of module names that specify sections of your application. **Bundles** is a way to break up your application into many parts and progressively load assets as you visit the different sections. This makes it easy to write an single-page application and have the performance benefits of a multi-page application. To specify bundles pass an array of the bundles into this option like so:

    bundles: ["todos", "groceries", "notes"]

Each module id is the entry point for that bundle. Steal will intelligently break apart your code into different shared bundles and only load those needed depending on which section the user is visiting.

#### env

The environment steal is running in. Options are **development** and **production**, with development being the default. If running in production specify the env option in the script tag:

    <script src="steal.js" data-env="production"></script>

## StealTools

**StealTools** are a set of tools that aid with building Steal projects. They can be used from the command line, with [Grunt](http://gruntjs.com/), or programmatically in Node.js. If using from the command line you'll likely want to install StealTools globally:

    npm install steal-tools -g

### Build

Steal's build will transform your dependency graph into distinct bundles of JavaScript and CSSto be run in production. If using all of the default options you only need to specify the location to your config file and a main module like so:

    steal build --config app/config.js --main app/app

If using with Grunt these options are part of the `system` options, like so:

    grunt.initConfig({
      stealBuild: {
        default: {
          options: {
            system: {
              config: __dirname + "/app/config.js",
              main: "app/app"
            },
            buildOptions: {
              minify: false
            }
          }
        }
      }
    });

As you can see, the grunt task takes 2 object as its options, `system` and `buildOptions`. **buildOptions** is where you specify additional options specific to building, as described in the section below.

#### Options

##### minify

**minify** specifies where to minify the output bundles; defaults to `true`.

##### distDir

By default build will save the bundles to `dist/bundles/`. With **distDir** you can specify an alternative dist directory such as `distDir: build` in which case the bundles will be saved to `build/bundles/`. If using distDir you have to specify the location of your app's main module in your production.html file, like so:

    <script>
      steal = { paths: { "bundles/main": "build/bundles/main.js" } };
    </script>

##### bundleSteal

If using the **bundleSteal** option, Steal itself will be included in your bundled JavaScript file. This prevents the need for a second HTTP Request to load the main module.

### Pluginify

**Pluginify** is a way to build Steal projects without needing to include steal.js in production at all. Some of Steal's advanced features such as [bundles](#bundles) need steal.js to work, but for more simple projects Pluginify is a good option. Pluginify is also used when building open source projects where you want to split your modules into individual module file (hence *plugins*) and distribute them that way.

Like [build](#build), Pluginify can be used from the command-line, from Grunt, or programmatically in Node.js. For this example we're going to use Pluginify programmatically in order to showcase it's more advanced functionality:

    var pluginify = require("steal-tools").pluginify;
    var fs = require("fs");

    pluginify({
      config: __dirname + "/config.js",
      main: "main"
    }).then(function(pluginify){
      // Get the main module and it's dependencies as a string
      var main = pluginify();

      // Get just a dependency and it's own dependencies as a string
      var myModule = pluginify("my_module");

      // Get the main module, ignoring a dependency we don't want.
      var mainAlone = pluginify("main", {
        ignore: ["my_module"]
      });

      // Now you can do whatever you want with the module.
      fs.writeFileSync("out_main.js", mainAlone, "utf8");
    });

As you can see, pluginify takes an object containing the System configuration and returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). The promise will return another function (also named pluginify in this example) that can be used to generate a string containing a module and it's dependencies. By default the pluginify function will return the main module, but can be used to generate any dependency in the graph.

#### Options

##### ignore

Pluginify takes an array of strings specifying dependencies to ignore when building a module's string representation. For example, your project might depend on jQuery but you don't want to include jQuery in your production build, specifying `ignore: ["jquery"]` will prevent it from being included.

