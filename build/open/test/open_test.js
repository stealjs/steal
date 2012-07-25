// load('steal/build/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('steal', 'steal/test', function( s ) {
	STEALPRINT = false;
	s.test.module("steal/build/open")
	
	s.test.test("opens a basic page", function(){
		load('steal/rhino/rhino.js')
		
		steal('steal', "steal/build",function(s2){
			s2.build.open('steal/build/open/test/basic.js',function(opener){
				s.test.ok(opener,"got opener");
				var items = [];
				s.test.open('steal/build/open/test/basic.html')
				s.test.ok(window.basic)
				s.test.equals(window.appFiles[0], "one")
			});
			
		});
		s.test.clear();
	});

});