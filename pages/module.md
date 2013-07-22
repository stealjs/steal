@typedef {*} steal.module module

A module is a unit of functionality returned within a 
[steal.definition steal definition function].

A module is typically a function like:


    // sum.js
    steal(function(){
      return function(a, b){
        return a+b;
      }
    });

Or an object with functions like:

    // math.js
    steal(function(){
      return {
        sum: function(a, b){
          return a+b;
        },
        sub: function(a, b){
          return a-b;
        }
      }
    });
    
A module is referenced by a [steal.moduleId moduleId]. A module
often has dependencies specified 
by a [steal.moduleIdReference moduleIdReference].
