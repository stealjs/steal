@page steal
@parent StealJS.api
@group StealJS.syntaxes syntaxes
@group StealJS.config config
@group StealJS.modules modules
@group StealJS.types types

Steal is a  module loader that supports a wide variety of 
syntaxes and configuration options. It makes modular development, test,
and production workflows simple.

## Basics

After installing with bower or
[downloading](https://github.com/bitovi/steal/archive/master.zip),
add `steal.js` to your page like:

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

## Client Use

The basic use of `steal.js` is broken into three parts:

1. Loading `steal.js`.
2. Configuring the `System` loader and plugins.
3. Writing modules in a supported syntax.

### Loading `steal.js`

To load [steal] in the browser add a `<script>` tag who's source
points to `steal.js` like:

    <script src='../path/to/steal/steal.js'></script>

With this, you can begin loading modules using [System.import]. For example:

    <script src='../path/to/steal/steal.js'></script>
    <script>
      System.import("myapp").then(function(main){
        // main loaded successfully
      }, function(err){
        // an error loading main
      });
    </script>

This technique is great for example pages.

### Configuring the `System` loader

Once steal.js loads, its startup behavior is determined
configuration values.  Configuration values can be set in three ways:

 - Set on a `steal` object prior to loading steal.js like:
  
        <script>
          steal = {main: "myapp"};
        </script>
        <script src='../path/to/steal/steal.js'></script>
   
 - Attributes on the steal.js script tag like:
  
        <script src='../path/to/steal/steal.js'
                main="myapp"></script>
 
 - Calling [System.config] or setting `System` configuration properties
   after `steal.js` has loaded. This technique is typically used in the [@config] module.
  
        System.config({
          paths: {"can/*" : "http://canjs.com/release/2.0.1/can/*"}
        })
        System.meta["jquery"] = {format: "global"}
        
Typically, developers configure the [System.main] and [System.configPath] properties 
with attributes on the steal.js script tag like:

    <script src='../path/to/steal/steal.js'
            main="myapp"
            config-path="../config.js"
            ></script>
        
Setting [System.configPath] sets [System.baseURL] to the 
configPath's parent directory.  This would load `config.js` prior to
loading `../myapp.js`.

When steal.js loads, it sets [System.stealPath].  This sets default values
for [System.baseURL] and [System.configPath]. If `steal.js` is in `bower_components`,
[System.configPath] defaults to `bower_components` parent folder. So if you write:

    <script src='../../bower_components/steal/steal.js'
            main="myapp"></script>

This will load `../../stealconfig.js` before it loads `../../myapp.js`.

### Writing Modules

Once you've loaded and configured steal's behavior, it's time to start 
writing and loading modules.  Currently, [syntax.es6 ES6 syntax] is supported
in IE9+.  ES6 syntax looks like:

    import can from "can";
    
[@traceur Traceur Compiler] is used and all of 
of its [language](https://github.com/google/traceur-compiler/wiki/LanguageFeatures) will work.

If you must support <IE8, use any of the other syntaxes.

Finally, steal supports [$less less] and [$css css] out of the box. Import, require, or
steal them into your project by adding a "!" after the filename.

    // ES6
    import "style.less!";
    
    // AMD
    define(["style.less!"],function(){ ... });
    
    // CommonJS
    require("style.less!");
    
    // steal
    steal("style.less!")

