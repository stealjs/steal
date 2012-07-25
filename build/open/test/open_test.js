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
				opener.each('js', function( options ){
					items.push(options.id);
				});
				for(var i=0; i<items.length; i++){
					if(items[i] == 'steal/less/less.js')
					s.test.ok(true, 'less was loaded')
				}
			});
			
		});
		s.test.clear();
	});

});