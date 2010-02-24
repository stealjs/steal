Installer =  function(uri, name, getter, tag){
    this.getter = getter;
	this.tag = tag;
	if(! uri.match(/^http/)){
        this.name = uri;
        return this.check_plugin_list();
    }
    this.uri =  uri;
    if(name){
        this.name = name;
    }else
        this.guess_name(uri);
}
Installer.prototype = {
    install_using_http: function(options){
        this.install_dependancies();
        
        
        options = options || {};
        new steal.File(this.name).mkdir();
        var fetcher = new this.getter(this.uri, -1, this.name, null, this.tag)
        fetcher.quiet = options.quiet || true
        fetcher.fetch();
        print("\n  "+this.name+" plugin downloaded.");
        if(readFile(this.name+"/install.js")){
           
            var res = prompt.yesno("\n  "+this.name+" has an install script."+
                  "\n    WARNING! Install scripts may be evil.  "+
                  "\n    You can run it manually after reading the file by running:"+
                  "\n      load('steal/plugins/"+this.name+"/install.js')"+
                  "\n\n  Would you like to run it now? (yN):")
            if(res){
              print("  running ...")
              load(this.name+"/install.js")
            }
        }
    },
    guess_name: function(url){
      this.name = new steal.File(url).basename();
      if(this.name == 'trunk' || ! this.name){
          this.name = new steal.File( new steal.File(url).dir() ).basename();
      }
    },
  check_plugin_list : function(){
        print("  Looking for plugin ...")
        
        var plugin_list_source = readUrl("http://javascriptmvc.googlecode.com/svn/trunk/steal/rhino/command/plugin_list.json");
        var plugin_list;
        eval("plugin_list = "+plugin_list_source);
        this.uri = plugin_list[this.name]
        if(!this.uri){
            print("  no plugin named '"+this.name+"' was found.  Maybe try supplying a url.");
            quit();
        }
        print("  Installer found.")
        
    },
    install_dependancies : function(){
        print("  Checking dependencies ...")
        var depend_url = this.uri + (this.uri.lastIndexOf("/") == this.uri.length - 1 ? "" : "/" )+"dependencies.json"
        var depend_text;
        try{
           depend_text = readUrl(depend_url);
        }catch(e){};
        if(!depend_text ) {
            print("  No dependancies")
            return;
        }
		var dependancies
        try{
			dependancies = JSONparse( depend_text );
		}catch(e){
			print("  No or mailformed dependencies");
			return;
		}
        
        if(dependancies.plugins){
            for(var plug_name in dependancies.plugins){
                if(prompt.yesno("Install dependancy "+plug_name+"? (yN):")){
                    print("Installing "+plug_name+"...")
                    var plugin = new Installer(dependancies.plugins[plug_name] , plug_name);
                    plugin.install_using_http();
                }
            }
        }
        
        if(dependancies.plugins){
            for(var plug_name in dependancies.plugins){
                if(prompt.yesno("Install dependancy "+plug_name+"? (yN):")){
                    print("Installing "+plug_name+"...")
                    var plugin = new Installer(dependancies.plugins[plug_name] , plug_name);
                    plugin.install_using_http();
                }
            }
        }
        print("  Installed all dependencies for "+this.name)
    }
};
