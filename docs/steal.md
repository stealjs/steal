@page Steal steal
@parent StealJS.api
@group StealJS.syntaxes syntaxes
@group StealJS.config config
@group StealJS.modules modules
@group StealJS.types types

Steal is a  module loader that supports a wide variety of 
syntaxes and configuration options. It makes modular development, test,
and production workflows simple.

## Basics

Add `steal.js` to your page like:

    <script src='../path/to/steal/steal.js`
            config='./config.js'
            main='myapp'>
    </script>

This will load `config.js` which can be used to configure the behavior of
your site's modules. For example, to load jQuery from a CDN:

     //config.js
     System.config({
       paths: {'jquery': "http://code.jquery.com/jquery-1.11.0.min.js"}
     });

And it will load `myapp.js`. `myapp.js` can import
dependencies in any syntax it choses. For those betting on the future, 
use the upcoming [syntax.es6 ES6 module syntax]:

    // myapp.js
    import $ from 'jquery'
    $(document.body).appendChild("<h1>Hello World</h1>");

## Why 


[syntax.es6 ES6], [syntax.amd AMD], [syntax.CommonJS CommonJS] 
to load modules and their dependencies in [syntax.CommonJS]


[Steal steal], supports 
the future - [ES6 Module Loader](https://github.com/ModuleLoader/es6-module-loader) syntax -
with everything [traceur supports](https://github.com/google/traceur-compiler/wiki/LanguageFeatures),
while supporting AMD, and CommonJS.


[StealJS steal] comprises all the
code in `steal.js`.  `steal.js` can be downloaded [here](http://github.com/bitovi/steal/steal.js)
or installed.

`steal.js` 
packages and adds to two other projects:

 - [ES6ModuleLoader](https://github.com/ModuleLoader/es6-module-loader) - Provides the [Loader] and [System] Polyfill.
 - [SystemJS](https://github.com/systemjs/systemjs) - Provides most System extensions 
   like [System.paths], [System.map] and the [syntax.amd AMD] and [syntax.CommonJS CommonJS] syntaxes.

`steal.js` improves workflows by adding conventional behavior, CSS and LESS plugins, the [syntax.steal steal] 
syntax and the [System.env] extension. 

## Use

The basic use of `steal.js`

 - loading `steal.js`
 - configuring `steal.js`
 - writing modules in a [steal] supported syntax.
