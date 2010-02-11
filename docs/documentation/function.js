/**
 * Documents a function.
 * Doc can guess at a functions name and params if the source following a comment
 * matches something like:
 * @codestart
 * myFuncOne : function(param1, param2){}  //or
 * myFuncTwo = function(param1, param2){} 
 * @codeend
 * <h3>Directives</h3>
 * Use the following directives to document a function.
<pre>
[Steal.Doc.Function|@function] <i>function_name</i>                       -> Forces a function
[Steal.Doc.Directive.Param|@param] {<i>optional:type</i>} <i>param_name</i> <i>Description</i> -> Describes a parameter
[Steal.Doc.Directive.Return|@return] {<i>type</i>} <i>Description</i>                    -> Describes the return value
</pre>
 * Add <i>optional:</i> for optional params.  Other available directives: 
 * [Steal.Doc.Directive.Plugin|@plugin],[Steal.Doc.Directive.CodeStart|@codestart]
 * <h3>Example</h3>
@codestart
/* Adds, Mr. or Ms. before someone's name
* * @param {String} name the persons name
* * @param {optional:Boolean} gender true if a man, false if female.  Defaults to true.
* * @return {String} returns the appropriate honorific before the person's name.
* *| 
 honorific = function(name, gender){
@codeend
 */
Steal.Doc.Pair.extend('Steal.Doc.Function',
/* @static */
{
    code_match: /(?:([\w\.]+)|(["'][^"']+["']))\s*[:=]\s*function\(([^\)]*)/,
    init : function(){
        this.add(Steal.Doc.Directive.Return, Steal.Doc.Directive.Param, Steal.Doc.Directive.CodeStart, 
        Steal.Doc.Directive.CodeEnd,Steal.Doc.Directive.Plugin, Steal.Doc.Directive.Hide, 
        Steal.Doc.Directive.Tag)
        this._super();
    }
},
/* @prototype */
{
    code_setup: function(){
        var parts = this.Class.code_match(this.code);

        if(!parts){
            parts = this.code.match(/\s*function\s+([\w\.\$]+)\s*(~)?\(([^\)]*)/)
        }
        
        this.name = parts[1] ? parts[1].replace(/^this\./,"") : parts[2];
        //clean up name if it has ""
        if(/^["']/.test(this.name)){
            this.name = this.name.substr(1, this.name.length-2).replace(/\./g,"&#46;")
        }
        this.params = {};
        this.ret = {type: 'undefined',description: ""}
        var params = parts[3].match(/\w+/g);

        if(!params) return;
        
        for(var i = 0 ; i < params.length; i++){
            this.params[params[i]] = {description: "", type: "", optional: false, order: i, name: params[i]};
        }
    },
    

    /**
     * Sets the function's name if one can't be determined from the source
     * @param {Object} line
     */
    function_add: function(line){
        var m = line.match(/^@\w+\s+([\w\.\$]+)/)
        if(m) this.name = m[1];
    },
    /**
     * Returns the HTML signiture of the function.
     */
    signiture : function(){
        var res = [];
        var ordered = this.ordered_params();
        for(var n = 0; n < ordered.length; n++){
            res.push(ordered[n].name)
        }
        
        var n = this.name;
        return n+"("+res.join(", ")+") -> "+this.ret.type;
    },
    json : function(){
        return {
            plugin : this.plugin,
            name: this.full_name(),
            html : this.toHTML(),
			className : this.Class.className.toLowerCase(),
            ret : this.ret,
            params : this.ordered_params(),
            comment: this.real_comment,
            tags: this.tags 
        }
    },
    toFile : function(outputFolder){

        try{
            var res = this.jsonp();
            new Steal.File(outputFolder+this.full_name().replace(/ /g,"_").replace(/&#46;/g,".")+".json").save(res);
            
        }catch(e ){
            print("Unable to generate class for "+this.full_name()+" !")
            print("  Error: "+e)
        }
    }
});