/**
 * Used to set scope to add to classes or methods in another file.
 * Examples:
 * @codestart no-highlight
 * /* @add Steal.String Static *|         adds to Steal.String's static methods
 * /* @add Steal.Controller Prototype *|  adds to Steal.Controller's prototype methods
 * @codeend
 * It's important to note that add must be in its own comment block.
 */
Steal.Doc.Pair.extend('Steal.Doc.Add',
{
    comment_setup: Steal.Doc.Function.prototype.comment_setup,
    /**
     * Looks for a line like @add (scope) (Static|Prototype)
     * @param {String} line the line that had @add
     */
    add_add : function(line){
        var m = line.match(/^@add\s+([\w\.]+)\s*([\w\.]+)?/i)
        if(m){
            var sub = m.pop()
            this.sub_scope = sub ? sub.toLowerCase() : null;
            this.scope_name = m.pop()
        }
    },
    /**
     * Searches for the new scope.
     * @return {Steal.Doc.Pair} The new scope where additional comments will be added
     */
    scope : function(){
 
        var Class = Steal.Doc.Class
        
        //find
        var inst;
        for(var l =0 ; l < Class.listing.length; l++){
            if(Class.listing[l].name == this.scope_name) {
                inst = Class.listing[l];break;
            }
        }
        if(!inst){
            var Class =  Steal.Doc.Constructor
            for(var l =0 ; l < Class.listing.length; l++){
                if(Class.listing[l].name == this.scope_name) {
                    inst = Class.listing[l];break;
                }
            }
        }
        if(!inst) return this;
        if(this.sub_scope){
            var children = inst.children;
            var child;
            for(var i=0; i< children.length; i++){
                if(children[i].Class.className.toLowerCase() == this.sub_scope.toLowerCase()) {
                    child = children[i];break;
                }
            }
            if(child) return child;
        }
        return inst;
        
    },
    toHTML: function(){return ""},
    linker: function(){}
});




