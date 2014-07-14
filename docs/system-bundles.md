@property {Object<moduleName, Array.<moduleName>>} System.bundles
@parent StealJS.config

Bundles configuration allows a single bundle file to be loaded in place of separate module files.

@option {Object<moduleName, Array.<moduleName>>} An object where keys
are bundle [moduleName moduleNames] and values are Arrays of [moduleName moduleNames] that
the bundle contains.

In [System.env production] the [System.mainBundle] is written out to 
contain the [System.main] module.

@body

## Use

Specify `bundles` if you are using a prebuilt bundle. For example, if `"jqueryui.autocomplete"` 
and `"jqueryui.datepicker"` are in `"jqueryui.custom"`, you can specify that like:

    System.bundles["jqueryui.custom"] = [
      "jqueryui.autocomplete",
      "jqueryui.datepicker"
    ];

If `bundle` is passed to [StealTools], it will write out where to load bundles in the production bundles. 

## Production Default Values

In [System.env production] the [System.mainBundle] is written out to 
contain the [System.main] module.  For example:

    System.config({
      main: "myapp",
      env: "production"
    });
    System.mainBundle //-> "bundles/myapp";
    System.bundles["bundles/myapp"] = ["myapp"]

This way, when the `"myapp"` module is imported, System will load ["bundles/myapp"].


## Implementation

Provided by [SystemJS](https://github.com/systemjs/systemjs#bundles).