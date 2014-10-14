@property {Boolean|String|bowerConfig} System.bower
@parent StealJS.config

Enables the Bower extension and sets where to lookup bower depdendencies.

@option {Boolean}

Setting the value to try enables these default options:

* __config__: `{System.baseURL}/bower.json`
* __dependencies__: `{System.baseURL}/bower_components/{moduleName}`

@option {String}

Setting the value to a string allows you to override the location where dependencies will be fetched. The following options will be used:

* __config__: `{System.baseURL}/bower.json`
* __dependencies__: `{System.bower}/{moduleName}`

@option {bowerConfig}

Gives you full control of setting where to look for the bower's configuration file and the dependency folder. To set pass an object with each option:

    System.config({
      bower: {
        config: "config/bower.json",
        dependencies: "libs"
      }
    });

@body

## Use

Turning on the Bower extension by enabling it in your configuration (by setting any of the above options) will allow you to more easily use Bower within StealJS. Instead of having to set the paths for each of your bower dependencies, the Bower extension will automatically load each of your `dependencies` listed in your `bower.json` file. For example, say you have `lodash` as a dependency. This extension will allow you to do:

    System.import("lodash").then(function(_) {
      // use _ here
    });

Without ever having to set `lodash` up in your [@config]. StealJS will look for `lodash`'s `bower.sjon` file in `{dependencies}/lodash/bower.json`. From there it will use the `main` property of the json file to know which JavaScript to load as the module's main, which will ultimately be lodash's value.


## Implementation

Implemented by steal.
