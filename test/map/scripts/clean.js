//steal/js steal/test/map/scripts/compress.js

load("steal/rhino/steal.js");
steal.plugins('steal/clean',function(){
	steal.clean('steal/test/map/map.html',{indent_size: 1, indent_char: '\t'});
});
