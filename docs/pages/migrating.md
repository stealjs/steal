@page StealJS.migrating Migrating
@parent StealJS.guides


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

The old Steal always produced a `production.js` file, but this is no longer the case. Though configurable, by default the new Steal will place the production file in `dist/bundles` and it will be named after your main module.
