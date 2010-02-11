if (typeof Steal == 'undefined') Steal = {};

Steal.Docs = function(args){ this.args = args };
Steal.Docs.prototype = {
   
    scripts:[],
    scriptTypes: {"text/javascript" : true,"text/envjs" : true},
    files : [],

    init: function(){
       //read arguments in ...
       if (this.args.length == 0 || this.args.length > 2) {
          print("USAGE: docs <URL> [<OUTPUT_FOLDER>]");
          quit();
       }
       this.url = this.args[0];
       this.outputFolder = this.args[1] ? this.args[1] : '';
       if(this.outputFolder.match(/\\$/) == null && this.outputFolder != '') this.outputFolder += "\\";

       this.loadEnvjs(this.url);

       load("steal/docs/util/lang.js");
       load("steal/docs/util/file.js");
       load("steal/docs/util/json.js");
       load("steal/docs/util/class20.js");
       load("steal/docs/ejs/ejs.js");
       load("steal/docs/documentation/application.js");
       load("steal/docs/documentation/pair.js");
       load("steal/docs/documentation/directives.js");
       load("steal/docs/documentation/function.js");
       load("steal/docs/documentation/class.js");
       load("steal/docs/documentation/constructor.js");
       load("steal/docs/documentation/file.js");
       load("steal/docs/documentation/add.js");
       load("steal/docs/documentation/static.js");
       load("steal/docs/documentation/prototype.js");
       load("steal/docs/documentation/attribute.js");
       load("steal/docs/documentation/page.js");       
       
       for(var idx=0;idx<this.scripts.length;idx++){
    	   var file = {};
           var script = this.scripts[idx];
           
           if (script.type == "text/javascript"){ 
               file = {path: script.src, src: this.loadScriptText(script.src, false)};
           } else {
               file = {path: script.src, src: this.loadScriptText(script.src, true)};               
           }
           
           this.files.push( new Steal.Doc.File(file) ); 
           var length = this.scripts.length;
           print("File #" + (idx+1) + ":" + length + " - " + file.path);
       }       
       
       var app = new Steal.Doc.Application(this.files, this.outputFolder);
       app.generate();
       
       print("Generated Docs.");
       if(!window.MVCDontQuit) quit();       
    },
    
    loadEnvjs: function(url){
        //load html
        var self = this;
        load('steal/rhino/env.js');
        Envjs(url, {scriptTypes: this.scriptTypes, fireLoad: true, logLevel: 2,
            afterScriptLoad: {".*": function(script){ 
                    self.scripts.push(script);
                }
            },
            onLoadUnknownTypeScript: function(script){
                self.scripts.push(script);
            }
        });    
    },
    
    loadScriptText: function(src, isView){
    	var text = "";
        var base = "" + window.location;
        var url = Envjs.location(src.match(/([^\?#]*)/)[1], base);
        
        if(isView){
        	// FIXME assumes view paths start one folder deep from root
            url = url.replace(/file:\/\//,"../");
            url = Envjs.location(url, base);
        }
        
        if(url.match(/^file\:/)) {
            url = url.replace("file:/","").replace("\\", "/");
            text = readFile(url);
        }
        
        if(url.match(/^http\:/)) {
            text = readUrl(url);
        }

        return text;
    },
};


