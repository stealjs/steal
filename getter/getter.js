/*  This is a port to JavaScript of Rail's plugin functionality.  It uses the following
 * license:
 *  This is Free Software, copyright 2005 by Ryan Tomayko (rtomayko@gmail.com) 
     and is licensed MIT: (http://www.opensource.org/licenses/mit-license.php)
 */




Getter = function(urls_to_fetch, level, cwd, ignore){
    this.urls_to_fetch = [urls_to_fetch];
    this.level = level || 1
    this.cwd = cwd || "."
    this.quite =false
    this.ignore = ignore;
}
Getter.prototype = {
    ls: function(){
        var links = [];
        var rhf = this;
        this.urls_to_fetch.forEach(function(url){
            if(url.match( /^svn:\/\/.*/ ) ){
              print('not supported')
          
            }else{
                links.concat( rhf.links("", readUrl( url)	) );
            }
        });
        return links;
        //store and return flatten
    },
    links: function(base_url, contents){
        var links = []
        var anchors = contents.match(/href\s*=\s*\"*[^\">]*/ig);
        var ignore = this.ignore;
        anchors.forEach(function(link){
            link = link.replace(/href="/i, "");
            print
            if(link.match(/svnindex.xsl$/) || link.match(  /^(\w*:|)\/\//) || link.match(/^\./) ){
                
            }else
                links.push( (new steal.File(base_url)).join(link) );
        } )
        return links;
    },
    push_d: function(dir){
        this.cwd = (new steal.File(this.cwd)).join(dir);
        new steal.File( this.cwd ).mkdir()
    },
    pop_d: function(){
        this.cwd = new steal.File(this.cwd).dir();
    },
    download : function(link){
        //var text = readUrl( link);
        
        var bn = new steal.File(link).basename();
        var f = new steal.File(this.cwd).join(bn);
        if(f.match(this.ignore)){
            print("   I "+f);
            return;
        }
        
        var oldsrc = readFile(f);
        new steal.File(f).download_from( link, true );
        var newsrc = readFile(f);
        var p = "   "
        if(oldsrc){
            if(oldsrc == newsrc) return;
            print(p+"U "+f);
        }else{
            print(p+"A "+f);
        }
    },
    fetch : function(links ){
        var auto_fetch = !links;
        links = links || this.urls_to_fetch
        var rhf = this;
        links.forEach(function(link){
            link.match(/\/$/) || auto_fetch ? rhf.fetch_dir(link) : rhf.download(link);
        })
    },
    fetch_dir : function(url){
        this.level++;
        if(this.level > 0) this.push_d(  new steal.File(url).basename() );
        
        var contents = readUrl(url)
        this.fetch(this.links(url, contents));
        if(this.level > 0) this.pop_d();
        this.level --;
    }
    
}