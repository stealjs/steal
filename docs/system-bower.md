@property {Boolean} System.bower
@parent StealJS.config

Enables the Bower extension

@option {Boolean|String|Object}

Enables the Bower extension which will retrieve the `bower.json` file and use it
to automatically load dependencies. This eliminates the need to manually set the
`System.paths` property for every dependency you have installed from Bower. Instead
simply enable this extension and set the [bowerPath](system-bowerpath) if Steal
is not installed via Bower.

## Implementation

Implemented by steal.
