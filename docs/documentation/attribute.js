/**
 * @hide
 * Documents an attribute.  Example:
 * @codestart
 * Steal.Object.extend(Person, {
 *    /* Number of People *|
 *    count: 0
 * })
 * @codeend
 */
Steal.Doc.Pair.extend('Steal.Doc.Attribute',
 /* @prototype */
 {
     /**
      * Matches an attribute with code
      * @param {Object} code
      */
     code_match: function(code){
         return code.match(/(\w+)\s*[:=]\s*/) && !code.match(/(\w+)\s*[:=]\s*function\(([^\)]*)/)  
     },
     init : function(){
        this.add(
                Steal.Doc.Directive.Author,
                Steal.Doc.Directive.Return,
                Steal.Doc.Directive.Hide, Steal.Doc.Directive.CodeStart, Steal.Doc.Directive.CodeEnd, Steal.Doc.Directive.Alias,
                Steal.Doc.Directive.Plugin, Steal.Doc.Directive.Tag);
        this._super();
     }
 },{
     /**
      * Saves the name of the attribute
      */
     code_setup: function(){
        var parts = this.code.match(/(\w+)\s*[:=]\s*/);
        this.name = parts[1];
     },
     attribute_add: function(line){
        var m = line.match(/^@\w+ ([\w\.]+)/)
        if(m){
            this.name = m[1];
        }
     },
    json : function(){
        return {
            plugin : this.plugin,
            name: this.full_name(),
			className : this.Class.className.toLowerCase(),
            comment: this.real_comment
        }
    },
    toFile : function(outputFolder){
        try{
            var res = this.jsonp();
            new Steal.File(outputFolder+this.full_name()+".json").save(res);
            
        }catch(e ){
            print("Unable to generate class for "+this.full_name()+" !")
            print("  Error: "+e)
        }
    }
 })