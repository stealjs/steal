//steal/js steal/test/map/scripts/compress.js

load("steal/rhino/steal.js");
steal.plugins('steal/build','steal/build/scripts','steal/build/styles',function(){
	steal.build('steal/test/map/scripts/build.html',{to: 'steal/test/map'});
});
