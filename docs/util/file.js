Steal.File = function(path){ this.path = path };
Steal.File.prototype = {    
    save: function(src, encoding){
          var fout = new java.io.FileOutputStream(new java.io.File( this.path ));
    
          var out     = new java.io.OutputStreamWriter(fout, "UTF-8");
          var s = new java.lang.String(src || "");
        
          var text = new java.lang.String( (s).getBytes(), encoding || "UTF-8" );
                out.write( text, 0, text.length() );
                out.flush();
                out.close();
    }
};