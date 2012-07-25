// load('steal/build/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('steal/test/test.js', function( test ) {
	STEALPRINT = false;
	test.module("steal/build/open")
	
	test.test("opens a basic page", function(){
		load('steal/rhino/rhino.js')
		
		steal('steal', "steal/build",function(s2){
			s2.build.open('steal/build/open/test/basic.js',function(opener){
				test.ok(opener,"got opener");
				var items = [];
				opener.each('js', function( options ){
					items.push(options.id);
				});
				for(var i=0; i<items.length; i++){
					if(items[i] == 'steal/less/less.js')
					test.ok(true, 'less was loaded')
				}
			});
			
		});
		test.clear();
	});

});