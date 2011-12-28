// load("steal/build/packages/test/packages_test.js")
load('steal/rhino/rhino.js')
steal('steal/build/packages', function(){
	steal.build.packages('steal/build/packages/test/app.html')
})
