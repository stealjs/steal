@property ~
@parent StealJS.schemes

A lookup scheme that roots module lookup to your project's base folder, either your `system.directories.lib` folder or the [System.baseURL].

This syntax is supported by all module formats.

## Use

Prepend lookups with `~/` such as:

    var tabs = require("~/components/tabs/tabs");

This will load the module from `BASE/components/tabs/tabs.js`. If your package.json has:

    {
      "system": {
        "directories": {
          "lib": "src"
		}
	    ...
	  }
	}

Then it will be loaded from `BASE/src/components/tabs/tabs.js`.

## Alternatives

The **~** scheme is an alternative to using the package name for look up, such as:

     {
	   "name": "app"

	   ...
	 }

And loading as:

     var tabs = require("app/components/tabs/tabs");

Using ~ provides a shorter alias for your app's package name.

## Production

Note that in production you need to use your app's package name in your script tag such as:

    <script src="node_modules/steal/steal.js" main="app/main"></script>
