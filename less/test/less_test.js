// load('steal/less/test/less_test.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('//steal/test/test', function( s ) {
	//STEALPRINT = false;
	s.test.module("steal/build/styles")
	
	STEALPRINT = false;

	s.test.test("css", function(){
		load('steal/rhino/rhino.js');
		steal.plugins(
			'steal/build',
			'steal/build/scripts',
			'steal/build/styles',
			function(){
				steal.build('steal/less/test/page.html',
					{to: 'steal/less/test'});
			});
		
		var prod = readFile('steal/less/test/production.css').replace(/\r|\n|\s/g,""),
			expected = readFile('steal/less/test/productionCompare.css').replace(/\r|\n|\s/g,"");
		
		s.test.equals(
			prod,
			expected,
			"css out right");
			
		s.test.clear();
	})

});