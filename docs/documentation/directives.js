/**
 * @hide
 * The base directive class.  Classes extending [Steal.Doc.Pair] [Steal.Doc.Pair.static.add|add] directives
 * to be matched against.  The available directives are:
 * <ul>
 *     <li>[Steal.Doc.Directive.Init|init]</li>
 *     <li>[Steal.Doc.Directive.Param|param]</li>
 *     <li>[Steal.Doc.Directive.Inherits|inherits]</li>
 *     <li>[Steal.Doc.Directive.Return|return]</li>
 *     <li>[Steal.Doc.Directive.Author|author]</li>
 *     <li>[Steal.Doc.Directive.Hide|hide]</li>
 *     <li>[Steal.Doc.Directive.CodeStart|codestart]</li>
 *     <li>[Steal.Doc.Directive.CodeEnd|codeend]</li>
 *     <li>[Steal.Doc.Directive.Alias|alias]</li>
 *     <li>[Steal.Doc.Directive.Plugin|plugin]</li>
 * </ul>
 * <h3>How directives work</h3>
 * Directives mix in their add and add_more functions into Steal.Doc.Pair classes.  
 * These functions work with [Steal.Doc.Pair.prototype.comment_setup|Pair::comment_setup] to
 * read directives (things that look like <i>@something</i>) and make sense of their data.
 * 
 * 
 */
Steal.Class.extend("Steal.Doc.Directive",
/* @prototype */
{
    /**
     * Called when [Steal.Doc.Pair.prototype.comment_setup|comment_setup] first sees a line with the matching
     * directive.
     * If the function returns null or false, following lines without another directive will be added to 
     * real_comment.  If the function returns data, the add_more will be called with lines following this line
     * and the data returned.
     * 
     * In these functions, save the data from comments like:
     * @codestart
     * this.my_data = line.match(/\d\d/)
     * @codeend
     * It's important to note that this refers to the Pair instance of the class that has added this directive.
     * 
     * @param {String} line the line with the directive on it.
     * @return {Object} if false, add future lines to real_comment, otherwise, call add_more with future lines
     * and the data returned.
     */
    add: function(line){
        var m = line.match(/^\s*@(\w+)\s*(.*)/)
        if(m){
            this[m[1]] = m[2];
        }
    }
    /**
     * @function add_more
     * Adds lines following a directive.
     * @param {String} line the current comment line
     * @param {Object} prior data the data returned from the previous add or add_more.
     * @return {Object} if false, ends calling add_more with future lines, otherwise; calls add_more with the next
     * line and the return value.
     */
})
//start directives
/**
 * @hide
 * Describes constructor functionality.  Matches multiple lines
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Init',
{
    add: function(line){
            var parts = line.match(/\s?@init(.*)?/);
            if(!parts || !parts[1]){
                this.init_description = " ";
                return true;
            } 
            this.init_description = parts.pop();
            return this.init_description;
    },
    add_more: function(line){
        this.init_description +="\n"+ line;
    }
});
/**
 * @hide
 * Adds parameter information of the format: "@param {<i>optional:</i>type} name description" .
 * Matches multiple lines.
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Param',{
    add_more : function(line, last){
        if(last)
            last.description += "\n"+line;
    },
    /**
     * Adds @param data to the constructor function
     * @param {String} line
     */
    add: function(line){
        var parts = line.match(/\s*@param\s+(?:\{(?:(optional):)?([^}]+)\})?\s+([\w\.]+) ?(.*)?/);
        if(!parts){
            print("LINE: \n"+line+"\n does not match @params {optional:TYPE} NAME DESCRIPTION")
            return;
        }
        var description = parts.pop();
        var n = parts.pop();
        
        var param = this.params[n] ? this.params[n] : this.params[n] = {order: this.ordered_params().length };

        param.description = description || "";
        param.name = n;
        param.type = parts.pop()|| "";
        param.optional = parts.pop() ? true : false;
        return this.params[n];
    }
});
/**
 * @hide
 * Says current class or constructor inherits from another class or contructor.
 * Looks for "@inherits <i>constructor or class name</i>"
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Inherits',{
    add: function(line){
        var m = line.match(/^\s*@\w+ ([\w\.]+)/)
        if(m){
            this.inherits = m[1];
        }
    }
})
/**
 * @hide
 * Describes return data in the format "@return {type} description".
 * Matches multiple lines.
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Return',{
    add: function(line){
        var parts = line.match(/\s*@return\s+(?:\{([\w\.\/]+)\})?\s*(.*)?/);
        
        if(!parts) {
           return; 
        }
        
        var description = parts.pop() || "";
        var type = parts.pop();
        this.ret = {description: description, type: type};
        return this.ret;
    },
    add_more : function(line){
        this.ret.description += "\n"+line;
    }
})
/**
 * @hide
 * Describes who the author of a class is.
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Author',{
    add: function(line){
        var m = line.match(/^\s*@author\s*(.*)/)
        if(m){
            this.author = m[1];
        }
    }
});
/**
 * @hide
 * Hides this class or constructor from the left hand side bar.
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Hide',{
    add: function(line){
        var m = line.match(/^\s*@hide/)
        if(m){
            this.hide = true;
        }
    }
});
/**
 * @hide
 * Starts a code block.  Looks for "@codestart code_type".  Matches
 * multiple lines.  Must end with "@codeend".
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.CodeStart',{
    add: function(line){
        var m = line.match(/^\s*@codestart\s*([\w-]*)\s*(.*)/)
        if(m){
            this.comment_code_type = m[1] ? m[1].toLowerCase() : 'javascript';
            this.comment_code = [];
            return true;
        }
    },
    add_more : function(line){
        this.comment_code.push(line);
    }
});
/**
 * @hide
 * Stops a code block
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.CodeEnd',{
    add: function(line){
        var m = line.match(/^\s*@codeend/)
        
        if(m){
            var joined = this.comment_code.join("\n");
			if(this.comment_code_type == "javascript")
				joined = joined.replace(/\*\|/g,"*/")
			this.real_comment += 
            "<pre><code class='"+this.comment_code_type+"'>"+joined+"</code></pre>"
        }
        return false;
    }
});
/**
 * @hide
 * This Class or Constructor is known by another name. Format: "@alias other_name"
 * 
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Alias',{
    add: function(line){
        var m = line.match(/^\s*@alias\s*([\w\-\.]*)/)
        if(m){
            this.alias = m[1];
        }
    }
});
/**
 * @hide
 * Adds to another plugin. Format: "@plugin plugin_name"
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Plugin',{
    add: function(line){
        this.plugin = line.match(/@plugin ([^ ]+)/)[1];
    }
});

/**
 * @hide
 * Adds tags for searching
 */
Steal.Doc.Directive.extend('Steal.Doc.Directive.Tag',{
    add: function(line){
        var parts = line.match(/^\s*@tag\s*(.+)/);
        
        if(!parts) {
           return; 
        }
        this.tags = parts[1].split(/\s*,\s*/g)
        //return this.ret;
    }//,
    //add_more : function(line){
    //    this.tags.concat(line.split(/\s*,\s*/g))
    //}
})
