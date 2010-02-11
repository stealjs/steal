/**
 * A base class for a comment and the line of code following it.
 * @hide
 */
Steal.Class.extend("Steal.Doc.Pair",
/* @Static */
{
    code_match: function(){ return null},
    classes: [],
    extended: function(Klass){
        if(Klass.className){
            this.classes.push(Klass)
        }
    },
    /**
     * From the comment and code, guesses at the type of comment and creates a new
     * instance of that type.
     * @param {String} comment - the comment
     * @param {String} code - the first line of source following the comment
     * @param {Steal.Doc.Pair} scope - The current scope of documentation.  
     * This is typically a Class, Constructor, Static, or Prototype
     * @return {Steal.Doc.Pair} - If a type can be found, the new Doc object; otherwise, null.
     */
    create: function(comment, code, scope){
        var check =  comment.match(/^@(\w+)/), type
    
        if(!(type = this.has_type(check ? check[1] : null)) ){ //try code
            type = this.guess_type(code);
        }
        if(!type) return null;
        return new type(comment, code, scope)
    },
    /**
     * Looks for a Doc class with a className for the given type
     * @param {String} type a potential className
     */
    has_type: function(type){
        if(!type) return null;
        for(var i=0;i< this.classes.length; i++){
            if(this.classes[i].className.toLowerCase() == type.toLowerCase() ) 
                return this.classes[i];
        }
        return null;
    },
    /**
     * Tries to guess at a piece of code's type.
     * @param {Object} code
     */
    guess_type: function(code){
        for(var i=0;i< this.classes.length; i++){
            if(this.classes[i].code_match(code) ) 
                return this.classes[i];
        }
        return null;
    },
    starts_scope: false,
    /**
     * Given a and b, sorts by their full_name property.
     * @param {Object} a
     * @param {Object} b
     */
    sort_by_full_name : function(a, b){
       var af = a.full_name ? a.full_name.toLowerCase() : a.full_name
       var bf = b.full_name ? b.full_name.toLowerCase() : a.full_name
       if(af == bf) return 0;
       return af > bf ? 1: -1;
    },
    sort_by_name : function(a, b){
       var af = a.name ? a.name.toLowerCase() : a.name
       var bf = b.name ? b.name.toLowerCase() : a.name
       
       if(af == bf) return 0;
       return af > bf ? 1: -1;
    },
    /**
     * Loads a template to use to render different doc types.
     */
    init : function(){
        if(this.className){
             this._view =  Steal.Doc.get_template(this.className)    
        }
		this.listing = [];
    },
    /**
     * Adds [Steal.Doc.Directive|directives] to this class.
     * @codestart
     * {
     *   init: function(){
     *     this._super();
     *     this.add(Steal.Doc.Directive.Return, Steal.Doc.Directive.Param)
     *   }
     * }
     * @codeend
     */
    add : function(){
        var args = Steal.makeArray(arguments)   
        for(var i = 0; i < args.length; i++){
            this._add(args[i]);
        }
    },
    _add : function(directive){
        var start = directive.className.toLowerCase()+"_"
        this.prototype[start+"add"] = directive.prototype.add
        if(directive.prototype.add_more)
            this.prototype[start+"add_more"] = directive.prototype.add_more
    },
    matchDirective : /^\s*@(\w+)/
},
/* @Prototype */
{
    /**
     * Saves coment, code.  Adds self to parent.  Calls code_setup and comment_setup.
     * Finally, adds to Steal.Doc.objects.
     * @param {String} comment
     * @param {String} code
     * @param {Steal.Doc.Pair} scope
     */
    init : function(comment, code, scope ){
        this.children = []
        this.comment = comment;
        this.code = code;

        
        
        if(this.Class.code_match(this.code))
            this.code_setup();
        this.comment_setup();
        
		//we need to add to a class if we 
		this.add_parent(scope);
        
        var par = this;
        while(par && !par.url){
            par = par.parent;
        }
        if(par){
            Steal.Doc.objects[this.full_name()] = par.url()+(this.url ? "" : "#"+this.full_name() );
        }
		this.Class.listing.push(this);
        
    },
    add: function(child){
        this.children.push(child);
    },
    add_parent : function(scope){
         this.parent = scope;
         this.parent.add(this);
    },
    scope: function(){
        return this.Class.starts_scope ? this : this.parent
    },
    code_setup: function(){},
	jsonp: function(){
		return "C("+Steal.toJSON(this.json())+")";
	},
    toHTML : function(){
       return this.Class._view.render(this)
    },
    full_name: function(){
        var par = ""
        if(!this.parent){
            print(this.name+" has no parent ")
        }else
            par = this.parent.full_name();
        return (par ? par+"." : "")+this.name ;
    },
    make : function(arr){
        var res = ["<div>"];
        //we should alphabetize by name
        
        for(var c=0; c<arr.length; c++){
            var child = arr[c];
            res.push(child.toHTML());
        }
        res.push("</div>");
        return res.join("");
    },
    linker : function(stealSelf){
        var result = stealSelf ? [ {name: this.full_name(), className : this.Class.className.toLowerCase(), title: this.title, hide: (this.hide ? true: false) }] : [];
        if(this.children){
            for(var c=0; c<this.children.length; c++){
                var adds = this.children[c].linker(true);
                if(adds)
                    result = result.concat( adds );
            }
        }
        return result;
    },
    /**
     * Orders params into an array.
     */
    ordered_params : function(){
            var arr = [];
            for(var n in this.params){
                var param = this.params[n];
                arr[param.order] = param;
            }
            return arr;
    },
    /**
     * Goes through the comment line by line.  Searches for lines starting with a <i>@directive</i>.
     * If a line with a directive is found, it sees if the instance has a function that matches
     * <i>directive</i>_add exists.  If it does, <i>directive</i>_add is called on that object.
     * If following lines do not have a directive, the <i>directive</i>_add_more function is called
     * on the instance
     * <br/>
     * Initial comments are added to real_comment.<br>
     * This function is shared by Class and Constructor.
     */
    comment_setup: function(){
        var i = 0;
        var lines = this.comment.split("\n");
        this.real_comment = '';
        if(!this.params) this.params = {};
        if(!this.ret) this.ret = {type: 'undefined',description: ""};
        var last, last_data;
        for(var l=0; l < lines.length; l++){
            var line = lines[l];
            var match = line.match(Steal.Doc.Pair.matchDirective)
            if(match){
                
                var fname = (match[1]+'_add').toLowerCase();
                if(! this[fname]) {
                    this.real_comment+= line+"\n"
                    continue;
                }
                last_data = this[fname](line);
                if(last_data) last = match[1].toLowerCase(); else last = null;
            }
            else if(!line.match(/^constructor/i) && !last )
                this.real_comment+= line+"\n"
            else if(last && this[last+'_add_more']){
                this[last+'_add_more'](line, last_data);
            }
        }
        if(this.comment_setup_complete) this.comment_setup_complete();
    }
})