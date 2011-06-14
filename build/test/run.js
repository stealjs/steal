// load('steal/build/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('//steal/test/test', function( s ) {
	STEALPRINT = false;
	s.test.module("steal/build")
	
	s.test.test("open", function(){
		load('steal/rhino/rhino.js')
		steal.plugins("steal/build").then(function(newSteal){
			var count = 0;
			newSteal.build.open("steal/build/test/stealpage.html", function(scripts){
				scripts.each(function(stl, content){
					count++;
					s.test.equals(content.length > 1, true, "No content from "+stl.path)
				})
			})
			s.test.equals(count, 4, "Basic source not right number")
			
		});
		s.test.clear();
	});
	
	s.test.test("using stealjs", function(){
		load('steal/rhino/steal.js')
		steal.plugins("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/stealpage.html", {
				to: 'steal/build/test'
			})
		});
		
		s.test.clear();
		s.test.open('steal/build/test/stealprodpage.html')
		var res = ["0","1","2"]
		s.test.equals(packagesStolen.length, res.length, "Lengths not equal");
		for(var i=0; i < res.length; i++){
			s.test.equals(packagesStolen[i],res[i])
		}
		s.test.clear();
	
		s.test.remove('steal/build/test/production.js')
		
	});

	
	s.test.test("jquery ready code doesn't run", function(){
		load('steal/rhino/steal.js')
		steal.plugins("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/jqueryready.html", {
				to: 'steal/build/test'
			})
		});
		
		s.test.equals(jqueryReadyCodeRun, false, "document ready code not called");
		s.test.clear();
		s.test.remove('steal/build/test/production.js')
		
	});

	
	// test that production created successfully
	// this test has zero assertions
	// if it fails no production file will be created so it will error
	s.test.test("duplicate dependencies don't finish early", function(){
		load('steal/rhino/steal.js')
		steal.plugins("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/circular/circular.html", {
				to: 'steal/build/test/circular'
			})
		});
		s.test.open('steal/build/test/circular/prod.html');
		s.test.remove('steal/build/test/circular/production.js')
		s.test.clear();
		
	});
	
	// Closure doesn't handle these characters, and you should probably be pulling them in from elsewhere.
	// but I'd still like this to work.
	return;
	s.test.test("foreign characters", function(){
		s.test.remove('steal/build/test/production.js')
		load('steal/rhino/steal.js')
		steal.plugins("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/foreign.html", {
				to: 'steal/build/test'
			})
		})
		
		s.test.clear();
	
		//check that srcs are equal
		f1 = readFile('steal/build/test/foreign.js')
			.replace(/[\r\n;]/g,"");
		f2 = readFile('steal/build/test/production.js').replace(/steal\.\w+\([^\)]+\);/g,"")
			.replace(/[\r\n;]/g,"");
		s.test.equals(f1, f2, "Foreign Characters")
	
		s.test.clear();
		s.test.remove('steal/build/test/production.js')
	});
	
	
	

});