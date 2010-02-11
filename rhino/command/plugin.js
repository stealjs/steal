Plugin =  function(uri, name){
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
Plugin.prototype = {
    install_using_http: function(options){
        this.install_dependancies();
        options = options || {};
        new File("steal/plugins/"+this.name).mkdirs();
        var fetcher = new RecursiveHTTPFetcher(this.uri, -1, "steal/plugins/"+this.name);
        fetcher.quiet = options.quiet || false
        fetcher.fetch();
        print("  Plugin downloaded.")
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
        print("  Plugin found.")
        
    }
}
Plugin.prototype.install_dependancies = Engine.prototype.install_dependancies;

