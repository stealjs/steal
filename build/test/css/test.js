// load("steal/compress/test/css/test.js")

load('steal/rhino/steal.js')

steal('//steal/compress/css', function(steal){
	steal.compressCSS('steal/compress/test/css/page.html',{to: "steal/compress/test/css/production.css"})
})