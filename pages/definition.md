@typedef {function(*):*} steal.definition(moduleValue...) definition
@parent steal.types

@description Determines the value of the module.



@param {*} [moduleValue...] The [steal.moduleIdReference moduleIdReference]'s 
module's values are passed as arguments to the callback 
definition function. For example:

    steal('jquery','can', function($, can){
      var template = can.view.mustahe("{{greet}}")
      $(document.body)
        .html(template({greet: "Hi"}))
    })

Module's that do not have a value (such as CSS) simply provide
an undefined argument as their moduleValue. For example:

    steal('jquery','foo.less', function($, foo, can){
      foo //-> undefined
    })


@return {*} The value of the module. If a value is
return, that value is used as the value of the module.


@body

## Use


