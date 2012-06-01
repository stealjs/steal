// load("steal/build/packages/test/packages_test.js")
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('steal/test', function( s ) {
	STEALPRINT = false;
	s.test.module("steal/build/packages")

	s.test.test("steal.build.packages", function(){
		load('steal/rhino/rhino.js');
		steal('steal/build/packages',
			function(){
				steal.build.packages('steal/build/packages/test/app.html')
				
				// TODO change this test to actually open the app in packages mode instead of hardcoding the files
				var filesToCompare = [
					'production.css',
					'production.js',
					'packages/accordion.js',
					'packages/resize.js',
					'packages/resize-accordion.js',
					'packages/resize-accordion-table_scroll.js',
					'packages/resize-table_scroll.js',
					'packages/table_scroll.js',
					'packages/table_scroll.css'
				];
				
				for(var i=0;i<filesToCompare.length; i++){
					s.test.compareFiles(
						'steal/build/packages/test/answerkey/'+filesToCompare[i],
						'steal/build/packages/test/'+filesToCompare[i],
						filesToCompare[i]+' packaged');
					s.test.remove('steal/build/packages/test/'+filesToCompare[i])
				}
					
				s.test.clear();
			});
	});

});