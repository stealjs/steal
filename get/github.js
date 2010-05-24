/*  This is a port to JavaScript of Rail's plugin functionality.  It uses the following
 * license:
 *  This is Free Software, copyright 2005 by Ryan Tomayko (rtomayko@gmail.com) 
     and is licensed MIT: (http://www.opensource.org/licenses/mit-license.php)
 */




GithubGetter = function(urls_to_fetch, level, cwd, ignore, tag){
    this.urls_to_fetch = [urls_to_fetch];
    this.level = level || 0
    this.cwd = cwd || ".";
	this.orig_cwd = this.cwd
    this.quite =false
    this.ignore = [".gitignore", "dist"];
	
	// parse from URL
	var split = urls_to_fetch.split("/")
	this.username = split[3];
	this.project = split[4];
	this.branch = tag || "master";
}
GithubGetter.prototype = new Getter();

GithubGetter.prototype.get_latest_commit = function(){
    // http://github.com/api/v2/json/commits/list/pinhook/steal/master
	var latestCommitUrl = "http://github.com/api/v2/json/commits/list/"+this.username+"/"+this.project+"/"+this.branch;
	var commitsText = readUrl(latestCommitUrl)
	eval("var c = "+commitsText);
	var commitId = c.commits[0].tree
	return commitId;
}
GithubGetter.prototype.ls_top = function(link){
	var id = this.get_latest_commit();
	// http://github.com/api/v2/json/tree/show/pinhook/steal/4691fd3e934ea264beedadb624e2b9e27efe292e
	var browseUrl = "http://github.com/api/v2/json/tree/show/"+this.username+"/"+this.project+"/"+id;
	var browseText = readUrl(browseUrl)
	eval("var tree = "+browseText);
	var urls = [], item;
	for(var i=0; i<tree.tree.length; i++){
		item = tree.tree[i];
		if(item.type == "blob")
			urls.push(this.urls_to_fetch[0]+item.name);
		else if(item.type == "tree")
			urls.push(this.urls_to_fetch[0]+item.name+'/');
	}
	return urls;
}
GithubGetter.prototype.links = function(base_url, contents){
    var links = [], newLink;
    var anchors = contents.match(/href\s*=\s*\"*[^\">]*/ig);
    var ignore = this.ignore;
	var self = this;
    anchors.forEach(function(link){
        link = link.replace(/href="/i, "");
		newLink = self.urls_to_fetch[0] + self.cwd.replace(self.orig_cwd+"/", "")+"/"+link;
		links.push(newLink);
    } )
    return links;
}
GithubGetter.prototype.download = function(link){
	// get real download link
	// http://github.com/pinhook/funcunit/qunit/qunit.js
	// http://github.com/pinhook/steal/raw/master/test/qunit/qunit.js
	var rawUrl = this.urls_to_fetch[0]+"raw/"+this.branch+"/"+link.replace(this.urls_to_fetch[0], "")
    var bn = new steal.File(link).basename();
    var f = new steal.File(this.cwd).join(bn);
	for(var i=0; i<this.ignore.length; i++){
	    if(f.match(this.ignore[i])){
	        print("   I "+f);
	        return;
	    }
	}
    
    var oldsrc = readFile(f);
	
    new steal.File("tmp").download_from( rawUrl, true );
    var newsrc = readFile("tmp");
    var p = "   "
    var pstar = "***"
    if(oldsrc){
		var trim = /\s+$/gm
		var jar = false
		if(/\.jar$/.test(f)) jar = true
        print(p+"Checking "+rawUrl.replace("http://github.com/pinhook/steal/raw/master/", ""))
		if ((!jar && oldsrc.replace(trim, '') == newsrc.replace(trim, ''))
			|| (jar && oldsrc == newsrc)) {
			return;
		}
        print(pstar+"Update "+f);
    	new steal.File("tmp").copyTo(f);
    }else{
        print(pstar+"Adding "+f);
    	new steal.File("tmp").copyTo(f);
    }
    new steal.File("tmp").remove();
}
GithubGetter.prototype.fetch_dir = function(url){
    this.level++;
    if(this.level > 0) this.push_d(  new steal.File(url).basename() );
    
	if(this.level == 0){
		this.fetch(this.ls_top())
	} else{
		// change to the raw url
		// http://github.com/pinhook/javascriptmvc/
		// http://github.com/pinhook/javascriptmvc/tree/master/controller?raw=true
		var rawUrl = this.urls_to_fetch[0]+"tree/"+this.branch+"/"+url.replace(this.urls_to_fetch[0], "")+"?raw=true"
        var contents = readUrl(rawUrl)
        this.fetch(this.links(url, contents));
	}
    if(this.level > 0) this.pop_d();
    this.level --;
}