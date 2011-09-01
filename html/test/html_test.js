load('steal/rhino/rhino.js');

print('here')
steal('steal/html', function(){
	print('hi')
	steal.html("steal/html/test/page.html#Hello+World!")
})
