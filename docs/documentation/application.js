/**
 * @class Steal.Doc
 * @tag core, documentation
 * JavaScriptMVC comes with powerful and easy to extend documentation functionality.
 * Steal.Doc is smart enough to guess 
 * at things like function names and parameters, but powerful enough to generate 
 * <span class='highlight'>JavaScriptMVC's entire website</span>!
 * 
 * <br/>
 * 
 * <p>Steal.Doc is pure JavaScript so it is easy to modify and make improvements.  First, lets show what
 * Steal.Doc can document: </p>
 * <ul>
 *     <li>[Steal.Doc.Attribute | @attribute] -  values on an object.</li>
 *     <li>[Steal.Doc.Function | @function] - functions on an object.</li>
 *     <li>[Steal.Doc.Constructor | @constructor] - functions you call like: new Thing()</li>
 *     <li>[Steal.Doc.Class| @class] - normal JS Objects and source that uses [jQuery.Class]</li>
 * </ul>
 * <p>You can also specifify where your functions and attributes are being added with: </p>
 * <ul>
 *     <li>[Steal.Doc.Prototype | @prototype] - add to the previous class or constructor's prototype functions</li>
 *     <li>[Steal.Doc.Static | @static] - add to the previous class or constructor's static functions</li>
 *     <li>[Steal.Doc.Add |@add] - add docs to a class or construtor described in another file</li>
 * </ul>    
 * <p>Finally, you have [Steal.Doc.Directive|directives] that provide addtional info about the comment:</p>
 * <ul>
 *     <li>[Steal.Doc.Directive.Alias|@alias] - another commonly used name for Class or Constructor</li>
 *     <li>[Steal.Doc.Directive.Author|@author] - author of class</li>
 *     <li>[Steal.Doc.Directive.CodeStart|@codestart] -> [Steal.Doc.Directive.CodeEnd|@codeend] - insert highlighted code block</li>
 *     <li>[Steal.Doc.Directive.Hide|@hide] - hide in Class view</li>
 *     <li>[Steal.Doc.Directive.Inherits|@inherits] - what the Class or Constructor inherits</li>
 *     <li>[Steal.Doc.Directive.Init|@init] - constructor function</li>
 *     <li>[Steal.Doc.Directive.Param|@param] - A function's parameter</li>
 *     <li>[Steal.Doc.Directive.Plugin|@plugin] - by which plugin this object gets Steal.</li>
 *     <li>[Steal.Doc.Directive.Return|@return] - what a function returns</li>
 *     <li>[Steal.Doc.Directive.Tag|@tag] - tags for searching</li>
 * </ul>
 * <h3>Example</h3>
 * The following documents a Person constructor.
 * @codestart
 * /* @constructor
 *  * Person represents a human with a name.  Read about the 
 *  * animal class [Animal | here].
 *  * @init 
 *  * You must pass in a name.
 *  * @params {String} name A person's name
 *  *|
 * Person = function(name){
 *    this.name = name
 *    Person.count ++;
 * }
 * /* @Static *|
 * Steal.Object.extend(Person, {
 *    /* Number of People *|
 *    count: 0
 * })
 * /* @Prototype *|
 * Person.prototype = {
 *   /* Returns a formal name 
 *    * @return {String} the name with "Mrs." added
 *    *|
 *   fancy_name : function(){
 *      return "Mrs. "+this.name;
 *   }
 * }
 * @codeend
 * There are a few things to notice:
 * <ul>
 *     <li>The example closes comments with <i>*|</i>.  You should close them with / instead of |.</li>
 *     <li>We create a link to another class with <i>[Animal | here]</i>.</li>
 * </ul>
 * 
 * <h3>Using with a JavaScritpMVC application</h3>
 * By default, compression will automatically document your code.  Simply compress your application with:
 * <pre>js apps/app_name/compress.js</pre>
 * The docs will be put in your docs folder.
 * <h3>Using without JavaScriptMVC</h3>
 * Coming soon ... maybe.
 * <h3>Inspiration</h3>
 * Steal.Doc was inspired by the [http://api.jquery.com/ jQuery API Browser] by [http://remysharp.com/ Remy Shharp]
 */
Steal.Doc = 
/* @Static */
{    
    render_to: function(file, ejs, data){
          new Steal.File(file).save( new Steal.EJS({ text: readFile(ejs), name: ejs }).render(data)  );
    },
    render : function(ejs, data){
         var v = new Steal.EJS({text: readFile(ejs), name: ejs });
        return v.render(data)
    },
    /**
     * Replaces content in brackets [] with a link to source.
     * @param {String} content Any text, usually a commment.
     */
    link_content : function(content){
        return content.replace(/\[\s*([^\|\]\s]*)\s*\|?\s*([^\]]*)\s*\]/g, function(match, first, n){
            //need to get last
            //need to remove trailing whitespace
            var url = Steal.Doc.objects[first];
            if(url){
                if(!n){
                    n = first.replace(/\.prototype|\.static/,"")
                }
                return "<a href='"+url+"'>"+n+"</a>"
            }else if(typeof first == 'string' && first.match(/^https?|www\.|#/)){
                return "<a href='"+first+"'>"+(n || first)+"</a>"
            }
            return  match;
        })
    },
    /**
     * Will replace with a link to a class or function if appropriate.
     * @param {Object} content
     */
    link : function(content){
        var url = Steal.Doc.objects[content];
        return url ? "<a href='#&who="+content+"'>"+content+"</a>" : content;
    },
    /**
     * A map of the full name of all the objects the application creates and the url to 
     * the documentation for them.
     */
    objects : {},
    get_template : function(template_name){
        var temp = readFile("docs/templates/"+template_name+".ejs");
        if(!temp)
            temp = readFile("steal/plugins/documentation/templates/"+template_name+".ejs");
        
        var v = new Steal.EJS({text: temp, name: template_name });
        return v;
    }
};

/**
 * @constructor
 * @hide
 * Creates documentation for an application
 * @init
 * Generates documentation from the passed in files.
 * @param {Array} total An array of path names or objects with a path and text.
 * @param {Object} app_name The application name.
 */
Steal.Doc.Application = function(total, outputFolder){
    
    this.outputFolder = outputFolder;
    this.total = total;
    this.files = [];
    
   
    for(var s=0; s < total.length; s++){
        script = total[s];
        if(typeof script == "string"){
            script = total[s] = {path: script, src: readFile(script)};
        }
        
        if(!script.func && !script.process){
            this.files.push( new Steal.Doc.File(total[s]) ) 
        }
	}
}


Steal.Doc.Application.prototype = 
/* @prototype */
{
    /**
     * Creates the documentation files.
     */
    generate : function(){
        /* Make the needed directory structure for documentation */
        //new Steal.File('docs/classes/').mkdirs();
       
         this.all_sorted = Steal.Doc.Class.listing.concat( Steal.Doc.Constructor.listing ).sort( Steal.Doc.Pair.sort_by_name )
        var summary = this.left_side();
        
        //make classes
        for(var i = 0; i < Steal.Doc.Class.listing.length; i++){
            Steal.Doc.Class.listing[i].toFile(this.outputFolder);
        }
        //Steal.Doc.Class.create_index();
        
        //make constructors
        for(var i = 0; i < Steal.Doc.Constructor.listing.length; i++){
            Steal.Doc.Constructor.listing[i].toFile(this.outputFolder);
        }
        //make functions
        
        for(var i = 0; i < Steal.Doc.Function.listing.length; i++){
            Steal.Doc.Function.listing[i].toFile(this.outputFolder);
        }
        for(var i = 0; i < Steal.Doc.Page.listing.length; i++){
            Steal.Doc.Page.listing[i].toFile(this.outputFolder);
        }
        
        for(var i = 0; i < Steal.Doc.Attribute.listing.length; i++){
            Steal.Doc.Attribute.listing[i].toFile(this.outputFolder);
        }
        
        
        this.summary_page(summary)
    },
    /**
     * @return {string} The left side bar.
     */
    left_side: function(){

        return readFile("docs/templates/left_side.ejs") ? 
            Steal.Doc.render("docs/templates/left_side.ejs", this) : 
            Steal.Doc.render("steal/plugins/documentation/templates/left_side.ejs" , this)
    },
    get_name : function(i){
        var me = this.all_sorted[i].name
        if(i == 0) return me;
        
        //break previous and self
        var previous = this.all_sorted[i-1].name;
        var t = me.split(/\./)
        var p = previous.split(/\./);
        var left_res = [], right_res = []
        for(var j = 0; j < t.length; j++){
            if(p[j] && p[j] ==  t[j])
                left_res.push(t[j])
            else
                right_res.push(t[j])
        }
        return (left_res.length > 0 ? 
        "<span class='matches_previous'>"+left_res.join(".")+".</span>" : "")+right_res.join(".")
    },
    /**
     * Creates a page for all classes and constructors
     * @param {String} summary the left hand side.
     */
    summary_page : function(summary){
        //find index page
        for(var p = 0; p < Steal.Doc.Page.listing.length; p++){
            if(Steal.Doc.Page.listing[p].full_name() == 'index')
                this.indexPage = Steal.Doc.Page.listing[p];
        }
        //checks if you have a summary
        if( readFile(this.outputFolder+"summary.ejs") ){
            Steal.Doc.render_to(this.outputFolder+"docs.html",this.outputFolder+"summary.ejs" , this)
        }else{
            print("Using default page layout.  Overwrite by creating: "+this.outputFolder+"summary.ejs");
            Steal.Doc.render_to(this.outputFolder+"docs.html","steal/docs/documentation/templates/summary.ejs" , this)
        }
        this.searchData();
        
    },
    indexOf : function(array, item){
        var i = 0, length = array.length;
        for (; i < length; i++)
          if (array[i] === item) return i;
        return -1;
    },
    addTagToSearchData : function(data, tag, searchData){
        
        var letter, l, depth=2, current= searchData;
        
        for(l=0; l < depth; l++){
            letter = tag.substring(l,l+1);
            if(!current[letter]){
                current[letter] = {};
                current[letter].list = [];
            }
            if(this.indexOf(current[letter].list, data) == -1)
                current[letter].list.push(data);
            current = current[letter];
        }
    },
	addToSearchData : function(list, searchData){
		var c, parts, part,  p,  fullName;
		for(var i =0; i < list.length; i++){
            c = list[i];
            //break up into parts
            fullName = c.full_name();
            searchData.list[fullName] = {name: fullName, className: c.Class.className.toLowerCase(), title: c.title, tags: c.tags};
			parts = fullName.split(".");
            for(p=0; p< parts.length; p++){
                part = parts[p].toLowerCase();
                if(part == "jquery") continue;
                this.addTagToSearchData(fullName, part, searchData)
            }
            //now add tags if there are tags
            if(c.tags){
                for(var t=0; t< c.tags.length; t++)
                    this.addTagToSearchData(fullName, c.tags[t], searchData);
            }
            
        }
	},
    searchData : function(){
        var sortedClasses = Steal.Doc.Class.listing.sort( Steal.Doc.Pair.sort_by_name )
        
		//go through and create 2 level hash structure
        var searchData = {list: {}};
        
        var docData = {};
        
        
        
        this.addToSearchData(sortedClasses, searchData)
        this.addToSearchData(Steal.Doc.Function.listing, searchData)
        this.addToSearchData(Steal.Doc.Constructor.listing, searchData)
		this.addToSearchData(Steal.Doc.Static.listing, searchData)
		this.addToSearchData(Steal.Doc.Prototype.listing, searchData)
		this.addToSearchData(Steal.Doc.Page.listing, searchData)
        this.addToSearchData(Steal.Doc.Attribute.listing, searchData)
        
        new Steal.File(this.outputFolder+"searchData.json").save("C("+Steal.toJSON(searchData, false)+")");

    },
    /**
     * Only shows five folders in a path.
     * @param {String} path a file path to convert
     * @return {String}
     */
    clean_path : function(path){
        return path;
        var parts = path.split("/")
         if(parts.length > 5) parts = parts.slice(parts.length - 5);
         return parts.join("/");
    }
}