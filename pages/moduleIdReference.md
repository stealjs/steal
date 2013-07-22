@typedef {String} steal.moduleIdReference moduleIdReference
@parent steal.types


A moduleIdReference is a string value that is used to 
look up a [steal.moduleId moduleId] and its associated module value. For exaxmple:

    steal("jquery","./foo","./bar.js","app")

Typically, a moduleIdReference closely reflects
a path to a module. For example: `steal("myapp/component.js")` will likely
reference the `myapp/component.js` __moduleId__ which will represent
the code at the file or url `STEALROOT/myapp/component.js`.

But, the __moduleId__ referenced by a moduleIdReference depends on several
factors. 

 - The syntax (steal, AMD, etc) being used
 - The moduleId of the module depending on the moduleIdReference
 - [steal.config]'s [steal.config.map map] and [steal.config.root root] configuration options

This provides a lot of flexibility for things like:

 - Using two different versions of a library (ex: jquery) in one application.

## Steal: reference -> id

Steal performs the following steps to convert a moduleIdReference to a
moduleId.

1. If the moduleIdReference starts with `"./"` 
   join it to the current moduleId.
   
        moduleIdReference     "./food.js" 
        current moduleId      "app/component.js"
        new moduleIdReference "app/food.js"

2. If the moduleIdReference ends with a "/" or without a file extension, take the
   everything after the last "/", add it to the end of the moduleIdReference and
   add ".js".
   
        moduleIdReference     "can/control" 
        new moduleIdReference "can/control/control.js"

3. If the current moduleId matches a property in [steal.config]'s [steal.config.map map]
   option, use the rule to convert the moduleIdReference.
   
        moduleIdReference       "jquery/jquery.js"
        current moduleId        "app/component.js"
        steal.config("map",{
          "app/" : {
             "jquery/jquery.js" : "jquery-1.5.js"
          }
        })
        new moduleIdReference    "jquery-1.5.js"

