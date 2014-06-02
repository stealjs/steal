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

## Quick Start

The following uses npm and bower to install steal, steal-tools, grunt,
and jQuery and creates a little app that writes `Hello World` to 
the page and build it. An application does not need to be setup this way
to work.  This is just a common way.

### Install

Install [Node.js](http://nodejs.org/) on your 
computer. Within your `ROOT` folder,
use npm to install bower, grunt, and steal-tools:

    > npm install -g bower
    > npm install grunt --save-dev
    > npm install steal-tools --save-dev

Use bower to install steal and jQuery:

    > bower install steal -S
    > bower install jquery -S

Your `ROOT` folder should contain all your static scripts and 
resources.  It should now look like this:

      ROOT/
        bower_components/
        bower.json
        node_modules/
        package.json
         
### Setup

Create `index.html`, `stealconfig.js`, and `main.js`, files in your ROOT folder so it looks like:

      ROOT/
        bower_components/
        bower.json
        node_modules/
        package.json
        index.html
        stealconfig.js
        main.js
        
`index.html` loads your app. Add the following code that loads `steal` and
tells steal to load the `main` module.

    <!DOCTYPE html>
    <html>
      <body>
        <script src='./bower_components/steal/steal.js'
                data-main='main'></script>
      </body>
    </html>

`stealconfig.js` is loaded by every page in your 
project. It is used to configure the location to modules and 
other behavior.  Use it to configure the location of the `"jquery"` module by adding the following
code:

    System.paths.jquery = "bower_components/jquery/dist/jquery.js";
    System.meta.jquery = { exports: "jQuery" };

`main.js` is the entrypoint of the application. It should load import your
apps other modules and kickoff the application. Write the following in `main.js`:

    import $ from "jquery";
    $(document.body).append("<h1>Hello World!</h1>");
    
This imports jQuery with ES6 module syntax.
    
### Run in the browser

Open `index.html` in the browser.  You should see a big "Hello World".

### Build

Create a `Gruntfile.js` in your ROOT folder. Configure grunt to 
call `stealBuild`

    module.exports = function (grunt) {
      grunt.initConfig({
        stealBuild: {
          html: "index.html"
        }
      });
      grunt.registerTask('build',['stealBuild']);
    };

After saving `Gruntfile.js` run:

    > grunt build
    
This will read `index.html` and build `dist/index.html` to load 
`dist/bundles/main.js`.  `dist/bundles/main.js` will include `steal.js`, `stealconfig.js`, the `main` module
and its dependencies.

Open `dist/index.html` to see your built app in action.


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

#### paths

#### ext

#### main

#### env

The environment steal is running in. Options are **development** and **production**, with development being the default. If running in production specify the env option in the script tag:

    <script src="steal.js" data-env="production"></script>

#### distPath

Only relevant when `env` is **production**, `distPath` is the path to the production files, by default `dist/`. This option only needs to be set if you specify an alternative `distDir` when doing a build. If used, include this option in the script tag:

    <script src="steal.js"
		        data-env="production"
            data-main="main"
            data-dist-path="build/"></script>

## StealTools

**StealTools** are a set of tools that aid with building Steal projects. They can be used from the command line, with [Grunt](http://gruntjs.com/), or programmatically in Node.js. If using from the command line you'll likely want to install StealTools globally:

    npm install steal-tools -g

### Build

### Pluginify


## Migrating from old Steal

### Config changes

#### Map

There is no longer a `"*"` mapping like before:

    steal.config({
      map: {
        "*": {
          "can/util": "can/util/jquery"
				}
      }
    });

Instead flatten these out:

    steal.config({
      map: {
        "can/util": "can/util/jquery"
      }
    });

#### Paths

When specifying that a folder's children should also be pathed, include an astericks to denote:

    steal.config({
      paths: {
        "can/": "lib/can/"
      }
    });

Add the astericks and specify the file type:

    steal.config({
      paths: {
        "can/*": "lib/can/*.js"
      }
    });

#### Ext

CSS and Less plugins come by default, you no longer need to specify these in `steal.config`'s ext option. But do add mustache and stache if using those with CanJS.

#### Then

The old Steal was chainable using `.then`, but this produced numerous problems that are better fixed inside the config. If you need a module to load before loading another, specify this with `deps` inside of the `meta` configuration for that module.

### Build

The old Steal always produced a `production.js` file, but this is no longer the case. Though configurable, by default the new Steal will place the production file in `/bundles` and it will be named after your main module.
