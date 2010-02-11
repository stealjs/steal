MVC = {
	Options: {},
	Test: {},
	File: function(path){ this.path = path; },
	runner: function(f){
		if(!window.in_command_window && !jQuery.browser.rhino)
			f();
	},
	mvc_root: null,
	steal_path: null,
	root: null,
	Object:  { extend: function(d, s) { for (var p in s) d[p] = s[p]; return d;} },
    get_random: function(length){
    	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    	var randomstring = '';
    	for (var i=0; i<length; i++) {
    		var rnum = Math.floor(Math.random() * chars.length);
    		randomstring += chars.substring(rnum,rnum+1);
    	}
        return randomstring;
    }
};
	
var File = steal.File;
steal.File.prototype = {
	clean: function(){
		return this.path.match(/([^\?#]*)/)[1];
	},
	dir: function(){
		var last = this.clean().lastIndexOf('/');
		return last != -1 ? this.clean().substring(0,last) : ''; //this.clean();
	},
	domain: function(){ 
		if(this.path.indexOf('file:') == 0 ) return null;
		var http = this.path.match(/^(?:https?:\/\/)([^\/]*)/);
		return http ? http[1] : null;
	},
	join: function(url){
		return new File(url).joinFrom(this.path);
	},
	joinFrom: function( url, expand){
		if(this.isDomainAbsolute()){
			var u = new File(url);
			if(this.domain() && this.domain() == u.domain() ) 
				return this.after_domain();
			else if(this.domain() == u.domain()) { // we are from a file
				return this.to_reference_from_same_domain(url);
			}else
				return this.path;
		}else if(url == MVC.page_dir && !expand){
			return this.path;
		}else{
			if(url == '') return this.path.replace(/\/$/,'');
			var urls = url.split('/'), paths = this.path.split('/'), path = paths[0];
			if(url.match(/\/$/) ) urls.pop();
			while(path == '..' && paths.length > 0){
				paths.shift();
				urls.pop();
				path =paths[0];
			}
			return urls.concat(paths).join('/');
		}
	},
	relative: function(){		return this.path.match(/^(https?:|file:|\/)/) == null;},
	after_domain: function(){	return this.path.match(/(?:https?:\/\/[^\/]*)(.*)/)[1];},
	to_reference_from_same_domain: function(url){
		var parts = this.path.split('/'), other_parts = url.split('/'), result = '';
		while(parts.length > 0 && other_parts.length >0 && parts[0] == other_parts[0]){
			parts.shift(); other_parts.shift();
		}
		for(var i = 0; i< other_parts.length; i++) result += '../';
		return result+ parts.join('/');
	},
	is_cross_domain : function(){
		if(this.isLocalAbsolute()) return false;
		return this.domain() != new File(location.href).domain();
	},
    /**
     * Returns if page starts with /
     */
	isLocalAbsolute : function(){	return this.path.indexOf('/') === 0},
	/**
	 * Returns if current file starts with https?|file
	 */
    isDomainAbsolute : function(){return this.path.match(/^(https?:|file:)/) != null},
    basename: function(){
        return this.path.match(/\/?([^\/]*)\/?$/)[1];
    },
    mkdir: function(){
        var out = new java.io.File( this.path )
        out.mkdir();
    },
    mkdirs: function(){
        var out = new java.io.File( this.path )
        out.mkdirs();
    },
    save: function(src){
        var out = new java.io.FileWriter( new java.io.File( this.path )),
            text = new java.lang.String( src || "" );
		out.write( text, 0, text.length() );
		out.flush();
		out.close();
    },
    download_from: function(address){
        /*var url = new java.net.URL(address);
        var out = new java.io.BufferedOutputStream(  new java.io.FileOutputStream(this.path));
        var conn = url.openConnection();
        var inp = conn.getInputStream();
        
        var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
        
        var stream = new java.io.InputStreamReader(conn.getInputStream()),
						buffer = new java.io.BufferedReader(stream), line, lines = [];
        var numRead = 0;
        while ((numRead = inp.read(buffer)) != -1) {
				out.write(buffer, 0, numRead);
		}
        inp.close();
        out.close();*/

       
       var input = 
           new java.io.BufferedInputStream(
               new java.net.URL(address).openStream()
           );
           
        bout = new java.io.BufferedOutputStream(
                new java.io.FileOutputStream(this.path),
                1024
            );
        var data = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
        var num_read = 0;
        while( (num_read = input.read(data,0,1024) ) >= 0    ) {
            bout.write(data, 0 , num_read);
        }
        bout.close();
    }
};
