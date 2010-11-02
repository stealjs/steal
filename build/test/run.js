// load('steal/compress/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/steal.js')
steal('//steal/test/test', function( s ) {
	
	print("==========================  steal/build =============================")
	
	//lets see if we can clear everything
	s.test.clear();

	load('steal/rhino/steal.js')
	steal("//steal/build/build")
	steal("//steal/build/scripts/scripts")

	steal.build("steal/build/test/basicpage.html", {
		to: 'steal/build/test'
	})
	s.test.clear();

	load("steal/build/test/basicproduction.js")
	s.test.equals(BasicSource, 6, "Basic source not right number")


	s.test.clear();
	s.test.remove('steal/build/test/basicproduction.js')
	
	print("-- Compress page using steal --");
	load('steal/rhino/steal.js')
	steal("//steal/build/build")
	steal("//steal/build/scripts/scripts")
	steal.build("steal/build/test/stealpage.html", {
		to: 'steal/build/test'
	})
	s.test.clear();

	s.test.open('steal/build/test/stealprodpage.html')
	s.test.equals(BasicSource, 7, "Basic source not right number")
	s.test.clear();

	s.test.remove('steal/build/test/production.js')

	print("-- Compress page with foreign characters --");
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
	if(f1 !=  f2){
	    print(f1+"\n---------------------------\n"+f2);
	    throw "Foreign characters aren't right";
	}

	s.test.clear();
	s.test.remove('steal/build/test/foreignproduction.js')

});