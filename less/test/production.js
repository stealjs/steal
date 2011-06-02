steal.loading('//steal/less/test/test.js','//steal/less/less');
steal.plugins("steal/less").then("styles.less","styles.css");
;
steal.loaded('//steal/less/test/test.js');
steal({src:"less_engine.js",ignore:true},function(){steal.type("less css",function(a,d,b){(new less.Parser({optimization:less.optimization,paths:[]})).parse(a.text,function(e,c){a.text=c.toCSS();b()})})});
;
steal.loaded('//steal/less/less');