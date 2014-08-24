@property {String} System.bowerPath
@parent StealJS.config

Configures loading of bower dependencies.

@option {String}

Specifies the location of the root `bower.json` which contains depdendency module names.

By default Steal will load `bower.json` from `stealPath` + `"../../bower.json"` if the 
stealPath is within a `bower_components` folder and the `bower` option is enabled.
If this is the case then `bowerPath` doesn't need to be set.

## Use

Setting `bowerPath` will allow Steal to know how to load [Bower](http://bower.io/) dependencies.

    steal.config({
      bowerPath: "config/bower.json"
    });

Will cause Steal to load the bower.json and use the `dependencies` object within to 
automatically load the dependencies from their proper location without the need for you to
manually set the `paths` for each.

For example, say you have `lodash` as a dependency. This extension will allow you to do:

    System.import("lodash").then(function(_) {
      // use _ here
    });

Without having to set up your paths first:

    System.paths.lodash = "bower_components/lodash/dist/lodash.compact.js";

## Implementation

Implemented by steal.
