@typedef {{dependencies: String, config: String}} bowerConfig

Configuration options for the Bower extension. Sets where to find the `bower.json` configuration file and the dependencies folder.

@option {String} dependencies

The folder which contains all of the local bower dependencies. By default this is named `bower_components` but can be overridden in the `.bowerrc` file by setting it's [directory](http://bower.io/docs/config/#directory) option.

@option {String} config

The path to the `bower.json` configuration file. By default this will be looked for in `{System.baseURL}/bower.json`.
