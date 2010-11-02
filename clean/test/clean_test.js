// load('steal/compress/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/steal.js')
steal('//steal/test/test', function( s ) {
	
	print("==========================  steal/clean =============================")
	
	
	//lets see if we can clear everything
	s.test.clear();
	load('steal/rhino/steal.js');
	steal.plugins('steal/clean');
	
	steal.File('steal/clean/test/test.js').copyTo('steal/clean/test/testStart.js')
	
	// clean this file and see if it looks like it should
	steal.clean('steal/clean/test/testStart.js')
	
	
	s.test.ok( readFile('steal/clean/test/testStart.js') == 
			readFile('steal/clean/test/testEnd.js') );
	steal.File('steal/clean/test/testStart.js').remove();
});