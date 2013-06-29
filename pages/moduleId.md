@typedef {String} steal.moduleId moduleId
@parent steal.types

A moduleId is the unique name within a [steal.ModuleManager] for
a [module]. A moduleId is typically determined from a
[steal.moduleIdReference moduleIdReference] which depends on:

 - The syntax (steal, AMD, etc) being used
 - The moduleId of the module depending on the moduleIdReference
 - [steal.config]'s [steal.config.map map] and [steal.config.root root] configuration options


In the following example the `"jquery"` [steal.moduleIdReference moduleIdReference] becomes
the `"jquery-1.5.js"` __moduleId__:

    // in app/component.js
    steal.config("map",{
       "app/" : {
          "jquery/jquery.js" : "jquery-1.5.js"
       },
       "paths": {
         "jquery-1.5.js": "http://cdn.com/jquery-1.5.js"
       }
    })
    
    steal("jquery")

The [steal.config]'s [steal.config.paths paths] option is used to configure where
the `"jquery-1.5.js" moduleId should be found.

In most applications, the __moduleId__ is the
unique name for a module across the entire application.  But steal.clone() can
be used to create a new [steal.ModuleManager] with its own configuration
and moduleId mappings.
