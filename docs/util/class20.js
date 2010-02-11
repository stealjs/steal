//Steal.Class 
// This is a modified version of John Resig's class
// It provides class level inheritence and callbacks.

(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/,
      callback = function(f_names){
		//process args
		var args = jQuery.makeArray(arguments), f, self;
        f_names = args.shift();
		if(!jQuery.isArray(f_names)) 
			f_names = [f_names];
		
		//check names ... should only be in development
		//for(f =0; f < f_names.length; f++ )
		//	if(typeof f_names[f] == "string" &&  typeof this[f_names[f]] != 'function')
		//		 throw 'There is no function named '+f_names[f]+'. ';
		self = this;
		return function(){
			var cur = args.concat(jQuery.makeArray(arguments)), isString
			for(f =0; f < f_names.length; f++){
                if(!f_names[f]) continue;
                isString = typeof f_names[f] == "string";
                if(isString && self._set_called) self.called = f_names[f];
                cur = (isString ? self[f_names[f]] : f_names[f]).apply(self, cur);
				if(!cur) 					      cur = [];
				else if( !jQuery.isArray(cur) || cur._use_call) cur = [cur]
			}
			return cur;
        }
    };
  // The base Class implementation (does nothing)
  
  /**
   * @constructor Steal.Class
   * @plugin lang/class
   * @tag core
   * Class provides simple simulated inheritance in JavaScript. 
   * It is based off John Resig's [http://ejohn.org/blog/simple-javascript-inheritance/|Simple Class] 
   * Inheritance library.  Besides prototypal inheritance, it adds a few important features:
   * <ul>
   *     <li>Static inheritance</li>
   *     <li>Class initialization callbacks</li>
   *     <li>Introspection</li>
   *     <li>Easy callback function creation</li>
   * </ul>
   * <h2>Examples</h2>
   * <h3>Basic example</h3>
   * Creates a class with a className (used for introspection), static, and prototype members:
   * @codestart
   * Steal.Class.extend('Monster',
   * /* @static *|
   * {
   *   count: 0
   * },
   * /* @prototype *|
   * {
   *   init : function(name){
   *     this.name = name;
   *     this.Class.count++
   *   }
   * })
   * hydra = new Monster('hydra')
   * dragon = new Monster('dragon')
   * hydra.name        // -> hydra
   * Monster.count     // -> 2
   * Monster.className // -> 'Monster'
   * @codeend
   * Notice that the prototype init function is called when a new instance of Monster is created.
   * <h3>Static property inheritance</h3>
   * Demonstrates inheriting a class property.
   * @codestart
   * Steal.Class.extend("First",
   * {
   *     staticMethod : function(){ return 1;}
   * },{})
   * First.extend("Second",{
   *     staticMethod : function(){ return this._super()+1;}
   * },{})
   * Second.staticMethod() // -> 2
   * @codeend
   * <h3 id='introspection'>Introspection</h3>
   * Often, it's nice to create classes whose name helps determine functionality.  Ruby on
   * Rails's [http://api.rubyonrails.org/classes/ActiveRecord/Base.html|ActiveRecord] ORM class 
   * is a great example of this.  Unfortunately, JavaScript doesn't have a way of determining
   * an object's name, so the developer must provide a name.  Class fixes this by taking a String name for the class.
   * @codestart
   * $.Class.extend("MyOrg.MyClass",{},{})
   * MyOrg.MyClass.className //-> 'MyClass'
   * MyOrg.MyClass.fullName //->  'MyOrg.MyClass'
   * @codeend
   * <h3>Construtors</h3>
   * Class uses static and class initialization constructor functions.  
   * @codestart
   * $.Class.extend("MyClass",
   * {
   *   init: function(){} //static constructor
   * },
   * {
   *   init: function(){} //prototype constructor
   * })
   * @codeend
   * The static constructor is called after
   * a class has been created, but before [Steal.Class.static.extended|extended] is called on its base class.  
   * This is a good place to add introspection and similar class setup code.
   * 
   * The prototype constructor is called whenever a new instance of the class is created.
   * 
   * 
   * @init Creating a new instance of an object that has extended Steal.Class 
        calls the init prototype function and returns a new instance of the class.
   * 
   */
  
  Steal.Class = 
  /* @Static*/
      function(){};
      
  /**
   * @function callback
   * Returns a callback function for a function on this Class.
   * The callback function ensures that 'this' is set appropriately.  
   * @codestart
   * $.Class.extend("MyClass",{
   *     getData : function(){
   *         this.showing = null;
   *         $.get("data.json",this.callback('gotData'),'json')
   *     },
   *     gotData : function(data){
   *         this.showing = data;
   *     }
   * },{});
   * MyClass.showData();
   * @codeend
   * <h2>Currying Arguments</h2>
   * Additional arguments to callback will fill in arguments on the returning function.
   * @codestart
   * $.Class.extend("MyClass",{
   *    getData : function(<b>callback</b>){
   *      $.get("data.json",this.callback('process',<b>callback</b>),'json');
   *    },
   *    process : function(<b>callback</b>, jsonData){ //callback is added as first argument
   *        jsonData.processed = true;
   *        callback(jsonData);
   *    }
   * },{});
   * MyClass.getData(showDataFunc)
   * @codeend
   * <h2>Nesting Functions</h2>
   * Callback can take an array of functions to call as the first argument.  When the returned callback function
   * is called each function in the array is passed the return value of the prior function.  This is often used
   * to eliminate currying initial arguments.
   * @codestart
   * $.Class.extend("MyClass",{
   *    getData : function(callback){
   *      //calls process, then callback with value from process
   *      $.get("data.json",this.callback(['process2',callback]),'json') 
   *    },
   *    process2 : function(type,jsonData){
   *        jsonData.processed = true;
   *        return [jsonData];
   *    }
   * },{});
   * MyClass.getData(showDataFunc);
   * @codeend
   * @param {String|Array} fname If a string, it represents the function to be called.  
   * If it is an array, it will call each function in order and pass the return value of the prior function to the
   * next function.
   * @return {Function} the callback function.
   */
  Steal.Class.callback = callback;
  
  
  
  
  // Create a new Class that inherits from the current class.
  
  Steal.Class.
    /**
     * Extends a class with new static and prototype functions.  There are a variety of ways
     * to use extend:
     * @codestart
     * //with className, static and prototype functions
     * $.Class.extend('Task',{ STATIC },{ PROTOTYPE })
     * //with just classname and prototype functions
     * $.Class.extend('Task',{ PROTOTYPE })
     * //With just a className
     * $.Class.extend('Task')
     * @codeend
     * @param {optional:String} className the classes name (used for classes w/ introspection)
     * @param {optional:Object} klass the new classes static/class functions
     * @param {optional:Object} proto the new classes prototype functions
     * @return {Steal.Class} returns the new class
     */
    extend = function(className, klass, proto) {
    if(typeof className != 'string'){
        proto = klass;
        klass = className;
        className = null;
    }
    if(!proto){
        proto = klass;
        klass = null;
    }
    
    
    
    proto = proto || {};
    var _super_class = this;
    var _super = this.prototype;
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    // Copy the properties over onto the new prototype
    for (var name in proto) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof proto[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(proto[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, proto[name]) :
        proto[name];
    }
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    Class.prototype.Class = Class;
    // Enforce the constructor to be what we expect
    Class.constructor = Class;
    // And make this class extendable
    
    for(var name in this){
        if(this.hasOwnProperty(name) && name != 'prototype'){
            Class[name] = this[name];
        }
    }
    
    for (var name in klass) {
      Class[name] = typeof klass[name] == "function" &&
        typeof Class[name] == "function" && fnTest.test(klass[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            this._super = _super_class[name];
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
            return ret;
          };
        })(name, klass[name]) :
        klass[name];
	};
    /**
     * @function newInstance
     * Creates a new instance of the class.  This method is useful for creating new instances
     * with arbitrary parameters.
     * <h3>Example</h3>
     * @codestart
     * $.Class.extend("MyClass",{},{})
     * var mc = MyClass.newInstance.apply(null, new Array(parseInt(Math.random()*10,10))
     * @codeend
     */
    Class.newInstance = function(){
        initializing = true;
        var inst = new Class();
        initializing = false;
        if ( inst.init )
            inst.init.apply(inst, arguments);
        return inst;
    }
    
    
    Class.extend = arguments.callee;
    /**
     * @attribute className 
     * The name of the class provided for introspection purposes.
     * @codestart
     * $.Class.extend("MyOrg.MyClass",{},{})
     * MyOrg.MyClass.className //-> 'MyClass'
     * MyOrg.MyClass.fullName //->  'MyOrg.MyClass'
     * @codeend
     */
    
    if (className) {
	  	var current = window
        var parts = className.split(/\./)
        for(var i =0; i < parts.length-1; i++){
            current = current[parts[i]] || ( current[parts[i]] = {} )
        }
        current[parts[parts.length - 1]] = Class
        Class.className = parts[parts.length - 1]
        /**
         * @attribute fullName 
         * The full name of the class, including namespace, provided for introspection purposes.
         * @codestart
         * $.Class.extend("MyOrg.MyClass",{},{})
         * MyOrg.MyClass.className //-> 'MyClass'
         * MyOrg.MyClass.fullName //->  'MyOrg.MyClass'
         * @codeend
         */
        Class.fullName = className;
	}
    /*
     * @function init
     * Implement this function and it will be called after the static and prototype properties of the class are added, but before
     * [Steal.Class.static.extended|extended] is called on the inheriting class.  "init" is a great place to put a class's setup code.
     * @param {Steal.Class} class the new class
     */
    if(Class.init) Class.init(Class);
    /*
     * @function extended
     * Implement this function and it will be called when a class extends your class.  
     * @param {Steal.Class} Class the extending class.  
     */
    if(_super_class.extended) _super_class.extended(Class);
    /* @Prototype*/
    return Class;
    /* @function init
     * Called with the same arguments as new Class(arguments ...) when a new instance is created.
     * @codestart
     * $.Class.extend("MyClass",
     * {
     *    init: function(val){
     *       this.val = val;
     *    }
     * })
     * var mc = new MyClass("Check Check")
     * mc.val //-> 'Check Check'
     * @codeend
     */
    //Breaks up code
    /**
     * @attribute Class
     * Access to the static properties of the instance's class.
     * @codestart
     * $.Class.extend("MyClass", {classProperty : true}, {});
     * var mc2 = new MyClass();
     * mc.Class.classProperty = true;
     * var mc2 = new mc.Class(); //creates a new MyClass
     * @codeend
     */
  };
  
  
  Steal.Class.prototype = {
      /**
       * @function callback
       * Returns a callback function.  This does the same thing as and is described better in [Steal.Class.static.callback].
       * The only difference is this callback works
       * on a instance instead of a class.
       * @param {String|Array} fname If a string, it represents the function to be called.  
       * If it is an array, it will call each function in order and pass the return value of the prior function to the
       * next function.
       * @return {Function} the callback function
       */
      callback : callback
  }
  
})();
