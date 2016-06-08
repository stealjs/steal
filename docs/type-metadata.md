@typedef {{}} load.metadata metadata
@parent StealJS.types

An object that is passed between `Loader` hooks.  Any values can be set.  These are the ones that `steal.js` and
SystemJS recognize.

@option {String} format Specifies what type of Syntax is used.  This can be specified like:

    "format amd";

@option {Array.<moduleName>} [deps] Dependencies of this module. If the module is a global
but implicitly depends on another, like jQuery, add that dependency here.

```
"meta": {
  "jquery-cookie": {
    "deps": ["jquery"]
  }
}
```

@option {String} [exports] The global property that is exported as this module's default export.

@option {function(this:Global,Module...)} [init] Allows for calling noConflict and
for other cleanup.  `this` will be the global object.

@option {Boolean} [sideBundle=false] Create a bundle for this module and exclude it from
StealTool's bundle optimization algorithm. This is useful for modules that are infrequently
used, like a page for your app that users rarely visit.

```
"meta": {
  "moduleA": {
    "sideBundle": true
  }
}
```

@option {Boolean} [bundle=false] Exclude a module from being bundled.
```
"meta": {
  "MODULENAME": {
    "bundle": false
  }
}
```
If you exclude a module from the bundled file, you have to make sure, that in the [production environment configuration](http://stealjs.com/docs/System.envs.html)
the module is:

* ... [mapped to the pseudo-module @empty](http://stealjs.com/docs/System.map.html#ignoring-optional-dependencies)

    ```
    "envs": {
        "window-production": {
            "map": {
                "MODULENAME': "@empty"
            }
        }
    }
    ```

* ... [configured](http://stealjs.com/docs/steal.html#path-configure) to the [right location](http://stealjs.com/docs/System.paths.html) of the module e.g. a CDN

    ```
    "envs": {
        "production": {
            "paths": {
                "jquery': "//code.jquery.com/jquery-2.2.1.min.js"
            }
        }
    }
    ```

@option {String} [eval=function] Specify the type of *eval* that should be applied to this module.

Most modules are evaled using the Function constructor like: `new Function(source).call(context)`. However, if you have a global module that looks like:

```
var Foo = function(){

};
```

Where `Foo` is the exported value in your configuration:

```
"system": {
	"meta": {
		"foo": {
			"format": "global",
			"exports": "Foo"
		}
	}
}
```

In this situation, the default `new Function` method of evaluation will not work and the `Foo` variable will not be set on the window. In this case we want to update our **eval** configuration to `script`:

```
"system": {
	"meta": {
		"foo": {
			"format": "global",
			"exports": "Foo",
			"eval": "script"
		}
	}
}
```

This will use `<script>` elements for evaluation and the `Foo` property will be set.
