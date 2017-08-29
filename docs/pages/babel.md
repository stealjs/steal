@page StealJS.babel Babel
@parent StealJS.topics

@body

# Using Babel

Babel is a popular library that allows developers to use next generation JavaScript (e.g. ES2015) in today's browsers via transpiling code into ES5. As of Steal 1.0 Babel is the default [config.transpiler transpiler]. This page explains some of the ways you can configure it.

## Specifying version

Steal bundles a version of Babel from the [babel-standalone](https://github.com/Daniel15/babel-standalone) project. This is based on Babel version **6**.

If you want to use the version of Babel that comes with Steal you can skip this section.

If you have a code-base that needs a specific version of Babel you can include it using paths config. Here's an example of using Babel version 5.

```
"steal": {
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

Steal's bundled version of Babel comes with the presets and plugins provided by the babel-standalone project. You can see the full list [here](https://github.com/babel/babel-standalone/blob/38475316d32c8957e9887728597915f6bf61bd10/src/index.js#L112).

To specify which plugins/presets you want to use, specify the [config.babelOptions] configuration like so:

```
"steal": {
  "babelOptions": {
    "presets": ["react"]
  }
}
```

### Defaults

Steal uses the following options by default even if custom presets/plugins are
provided.

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
