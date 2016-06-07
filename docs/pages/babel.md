@page StealJS.babel Babel
@parent StealJS.guides

@body

# Using Babel

Babel is a popular library that turns ES6 (now known as ES2015) code and transpiles it ES5 that can be used in today's browsers. As of Steal 1.0 Babel is the default [System.transpiler transpiler]. This page explains some of the ways you can configure it.

## Specifying version

Steal bundles a version of Babel from the [babel-standalone](https://github.com/Daniel15/babel-standalone) project. This is based on Babel version **6**.

If you want to use the version of Babel that comes with Steal you can skip this section.

If you have a code-base that needs a specific version of Babel you can include it using paths config. Here's an example of using Babel version 5.

```
"system": {
  "paths": {
    "babel": "node_modules/babel-core/browser.js"
  }
}
```

When building you'll also need to do transpiling yourself, which you can do by providing a [steal-tools.BuildOptions.transpile custom transpile function]:

```
var babel = require("babel-core"); // This is my version of babel
var stealTools = require("steal-tools");

stealTools.build({
  config: __dirname + "/package.json!npm"
}, {
  transpile: function(source, compileOptions) {
    return babel.transform(source, compileOptions);
  }
});
```

## Plugins / Presets

Steal's bundled version of Babel comes with the presets and plugins provided by the babel-standalone project. You can see the full list [here](https://github.com/Daniel15/babel-standalone/blob/master/src/index.js#L51).

To specify which plugins/presets you want to use, specify the [System.babelOptions] configuration like so:

```
"system": {
  "babelOptions": {
    "presets": ["react"]
  }
}
```

*__Note__ that currently only the presets/plugins provided by babel-standalone are supported, but the ability to use custom plugins is planned.*

### Defaults

if no presets/plugins are provided in config the following options are used by default:

```js
{
  "presets": [
    "es2015-no-commonjs",
    "react",
    "stage-0"
  ],
  "plugins": [
    "transform-es2015-modules-systemjs"
  ]
}
```
