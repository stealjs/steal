@property {Object.<String,moduleName>} System.ext
@parent StealJS.config

Configures plugin loading by module extension.

@option {Object.<String,moduleName>}

Specifies a plugin to add when an extension is matched in a module name. `steal.js` includes
defauls of:

    System.ext //-> {"css": "$css", "less": "$less"}

@body

## Use

The following:

    System.ext = {
      "ejs" : "lib/ejs.ejs"
    };

allows:

    System.import("foo.css")

Without having to write:

    System.import("foo.css!steal/css");

By default, `steal.js` configures `css` to point to "$css" and `less` to point to "$less".

## Implementation

Implemented by steal.