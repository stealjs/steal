load('steal/rhino/rhino.js');

steal('steal/test/test.js', function( s ) {
	STEALPRINT = true;
	s.test.module("steal/html")
	
	var crawlTest = function(type){
		s.test.test("crawl works for "+type, function(){
			load('steal/rhino/rhino.js')
			
			steal('steal/html/crawl', function(){
				steal.html.crawl("steal/html/test/page.html#!Hello+World!", 
				{
					out: 'steal/html/test/out',
					browser: type
				})
			})
			
			// test there are 2 pages
			var txt = readFile('steal/html/test/out/Hello+World!.html')
			s.test.ok(txt.indexOf('<div id="out"><p>#!Hello+World!</p></div>') != -1, "hello world generated correctly");
			
			// test opening page1, it has the right div
			var txt = readFile('steal/html/test/out/Foo.html')
			s.test.ok(txt.indexOf('<div id="out"><p>#!Foo</p></div>') != -1, "foo generated correctly");
			
			// remove generated pages
			s.test.deleteDir('steal/html/test/out');
			s.test.clear();
		});
	}
	crawlTest("envjs");
	crawlTest("phantomjs");

});