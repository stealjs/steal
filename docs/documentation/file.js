
/**
 * Represents a file.
 * Breaks up file into comment and code parts.
 * Creates new [Steal.Doc.Pair | Doc.Pairs].
 * @hide
 */
Steal.Doc.Pair.extend('Steal.Doc.File',
{
    group : new RegExp("(?:/\\*(?:[^*]|(?:\\*+[^*/]))*\\*+/\[^\\w\\{\\(\\[/]*[^\\n]*)", "g"),
    
    splitter : new RegExp("(?:/\\*+((?:[^*]|(?:\\*+[^*/]))*)\\*+/\[^\\w\\{\\(\\[\"'\$]*([^\\r\\n]*))")
},{
    /**
     * Generates docs for a file.
     * @param {Object} inc an object that has path and text attributes
     */
    init : function(inc){
        this.children = [];
        this.name = inc.path;
        this.src=inc.src;
//        print('   '+this.name)
        this.generate();
    },
    generate : function(){

        var pairs = this.src.match(this.Class.group);
        //clean comments
        var scope = this;
        if(!pairs) return;
        for(var i = 0; i < pairs.length ; i ++){
            var splits = pairs[i].match(this.Class.splitter);
            var comment = splits[1].replace(/^[^\w@]*/,'').replace(/\r?\n(\s*\*+)?/g,'\n');
            var code = splits[2];
            var pair = Steal.Doc.Pair.create( comment , code, scope);
            if(pair)
                scope = pair.scope();
        }
    },
    /**
     * Removes comment text from a comment. 
     * @param {Object} comment
     */
    clean_comment : function(comment){
        return comment.replace(/\/\*|\*\//,'').replace(/\r?\n\s*\*?\s*/g,'\n')
    },
    full_name: function(){
        return "";
    }
});