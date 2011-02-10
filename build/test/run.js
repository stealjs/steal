// load('steal/build/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/steal.js')
steal('//steal/test/test', function( s ) {
	STEALPRINT = false;
	s.test.module("steal/build")
	
	s.test.test("open", function(){
		load('steal/rhino/steal.js')
		steal.plugins("steal/build").then(function(newSteal){
			var count = 0;
			newSteal.build.open("steal/build/test/stealpage.html", function(scripts){
				scripts.each(function(stl, content){
					count++;
					s.test.equals(content.length > 1, true, "No content from "+stl.path)
				})
			})
			s.test.equals(count, 3, "Basic source not right number")
			
		});
		s.test.clear();
	});
	
	s.test.test("using stealjs", function(){
		load('steal/rhino/steal.js')
		steal.plugins("steal/build","steal/build")
		steal("//steal/build/scripts/scripts")
		steal.build("steal/build/test/stealpage.html", {
			to: 'steal/build/test'
		})
		s.test.clear();
		s.test.open('steal/build/test/stealprodpage.html')
		s.test.equals(BasicSource, 7, "Basic source not right number")
		s.test.clear();
	
		//s.test.remove('steal/build/test/production.js')
		
	});
	
	return;
	s.test.test("foreign characters", function(){
		load('steal/rhino/steal.js')
		steal("//steal/build/build")
		steal("//steal/build/scripts/scripts")
		steal.build("steal/build/test/foreign.html", {
			to: 'steal/build/test'
		})
		s.test.clear();
	
		//check that srcs are equal
		f1 = readFile('foreign.js').replace(/\r/,"");
		f2 = readFile('foreignproduction.js');
		s.test.equals(f1, f2, "Foreign Characters")
	
		s.test.clear();
		s.test.remove('steal/build/test/foreignproduction.js')
	});


});