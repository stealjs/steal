@property {Boolean|String|Object} System.bower
@parent StealJS.config

Enables the Bower extension and sets where to lookup bower depdendencies.

@option {Boolean}

Setting the value to `true` enables the Bower extension with the default options. The `bower.json` file will be fetched from `{System.baseURL}/bower.json` and components will be found in `{System.baseURL}/bower_components/{dependencyName}`.

@option {String}

This is if it's a string

@option {Object}

This is if it's an object

@body

## Implementation

Implemented by steal.
