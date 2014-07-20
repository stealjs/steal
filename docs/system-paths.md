@property {Object.<glob,glob>} System.paths
@parent StealJS.config

Configure the location of a module or modules.

@option {Object.<glob,glob>}

If a [moduleName] matches one of the keys of the `paths` config, it is located 
with at the value of the key. 

If paths for [@config], [@dev], [@traceur],
[$css], [$less], "bundles/*", and "bundles/*.css" are not set, `steal.js` 
will provide [default paths](#section_Defaultpathsconfiguredbysteal).

 
@body 

## Use

`System.paths` can be configued with any of the approaches in [System.config]. For example:

    System.paths['lodash/*'] = '/js/lodash/*.js'
    System.paths["theme/*"] = "jquery-ui/themes/base/jquery.ui.*css"

See [this issue](https://github.com/systemjs/systemjs/issues/113) on why `css` and other extensions have
strange rules.

## Default paths configured by steal

If the following paths are not specified, `steal.js` will use a default path according
to the following rules:


- [@config] - If `steal.js` is in _ROOT/bower\_components/steal/steal.js_, `@config` defaults to
  <i>ROOT/stealconfig.js</i>; otherwise, it defaults to 
  _[System.baseURL baseURL]/stealconfig.js_. Specifying `@config` will specify [System.baseURL baseURL].
- [@dev] - defaults to _STEAL\_BASE/steal/dev.js_
- [@traceur] - defaults to _STEAL\_BASE/traceur/traceur.js_
- [$css] - defaults to _STEAL\_BASE/steal/css.js_
- [$less] - defaults to _STEAL\_BASE/steal/less.js_
- `"bundles/*"` - defaults to _"dist/bundles/*.js"_
- `"bundles/*.css"` - defaults to _"dist/bundles/*css"_

_Note: `STEAL_BASE` is the parent folder of the steal folder._


## Implementation

Implemented in [ES6ModuleLoader](https://github.com/ModuleLoader/es6-module-loader/#paths-implementation)
