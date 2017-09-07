@page StealJS.configuration Configuration
@parent StealJS.topics

@body

Steal allows you to configure module loading through a **steal** property in your package.json. If you're not using Steal through npm (you should be) you can also configure using any of the options provided by [config.config].

A basic configuration might look like this:

```
{
  ...
  "steal": {
    "meta": {
      "jquery-plugin": {
        "deps": ["jquery"]
      }
    },
    "paths": {
      "some-dep": "lib/some/dep.js"
    },
    "plugins": [
      "steal-css"
    ]
  }
}
```

Here are some common uses of configuration:

## Configuring globals

Many modules you find on the web only have a single global build and don't work with module loaders that support AMD or CommonJS. jQuery plugins often are built this way.

To use these modules you need to configure them as globals. This is similar to **shim** config in RequireJS. Here's an example with each option explained:

```
{
  "dependencies": {
    "jquery": "2.2.2",
    "jquery-plugin": "0.2.0"
  },

  ...

  "steal": {
    "meta": {
      "jquery-plugin": {
        "deps": ["jquery"],
        "exports": "jQuery"
      }
    }
  }
}
```

### deps

The [load.metadata meta] **deps** property is an Array that specifies the module's dependencies. In this example we are saying that this module `jquery-plugin` depends on `jquery`.

### exports

The [load.metadata meta] **exports** property specifies a global value that is the module's value. For example if we had a module that did:

```
window.FOO = { ... };
```

We would specify this config with: `"exports": "FOO"`.  Then any other module that exports it like:

```
import foo from "foo";
```

Will get the `FOO` global.

## Plugins

Plugins (such as [steal-css](https://www.npmjs.com/package/steal-css)) should be installed as `devDependencies` and added to the `plugins` configuration in your `package.json`.

For example, to use `steal-css`, first install it with npm:

```
npm install steal-css --save-dev
```

Then update the `plugins` configuration in your `package.json`:

```json
{
  ...
  "devDependencies": {
    ...
    "steal-css": "^1.0.0"
  },
  "steal": {
    ...
    "plugins": ["steal-css"]
  }
}
```

## Progressively loaded bundles

In the [steal-tools.guides.progressive_loading progressive loading guide] we show how to progressively load different pages within your app. You import these modules using the [steal.import] function like so:

```
steal.import("app/cart").then(function(cart){

});
```

When using [steal-tools] to do a production build it needs to know about these progressively loaded bundles in order to perform its code splitting algorithm.

You can specify your bundles with the **bundle** property in config:

```
{
  ...
  "steal": {
    "bundle": [
      "app/cart"
	]
  }
}
```

Then when you perform a build it will create a bundle in `dist/bundles/app/cart.js` by default (you can specify the path using [config.bundlesPath bundlesPath] configuration).

## Specify your project's root folder

Often projects will store their code in a subfolder like `src/` or `public/` and do not want to include that when importing modules. Using **directories.lib** configuration you can specify your project's root folder:

```
{
  "name": "app",

  ...

  "steal": {
    "directories": {
      "lib": "src"
    }
  }
}
```

Then you can import modules from this folder by preceding imports with your package name like:

```
import util from "app/util";
```

*Note* that you cannot omit the package name when importing a module unless you use relative paths like `"./util"`.
