@function steal
@parent stealjs 0
@group steal.types Types
@group steal.pages Pages

Loads a Module.

@signature `steal(moduleIdRef..., definition(module...) )`

Loads scripts, css, and other modules into your application.

    steal('jquery','can','./app.less',function($, can){
      
    })

@param {steal.moduleIdReference...} moduleIdRef Specifies the module dependencies
of the current module. A 
[steal.moduleIdReference moduleIdReference] uses:

 - The [steal.moduleId moduleId] of the module depending on the moduleIdReference
 - [steal.config]'s [steal.config.map map] and [steal.config.root root] configuration options
 
too look up a [steal.moduleId moduleId]. 

The moduleId uses [steal.config]'s [steal.config.paths paths]
option to determine the file location or url of the module and 
the file extension and other [steal.config] values to determine
how to process the module to retrieve a value.

@param {steal.definition} [definition] A callback function
that gets passed the module values of the modules referenced by
the moduleIdReferences and whose return value defines the value of
the current module.

@return {steal} returns steal for chaining.

