load('steal/rhino/steal.js')

steal('//steal/compress/css', function(steal){
	steal.compressCSS('steal/compress/test/css/page.html',{})
})