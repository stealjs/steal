// load('steal/build/styles/test/styles_test.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('steal/test', function( s ) {
	//STEALPRINT = false;
	s.test.module("steal/build/js")
	
	//STEALPRINT = false;

	s.test.test("makePackage", function(){
		load('steal/rhino/rhino.js');
		steal('steal/build/js',
			function(){
				var res = steal.build.js.makePackage(
				[
					{
						buildType : "js",
						rootSrc : "a.js",
						text: "a"
					},
					{
						buildType : "js",
						rootSrc : "b.js",
						text: "b"
					},
					{
						buildType : "css",
						rootSrc : "c.css",
						text: "c"
					}
				],
				{
					"package/1.js" : ["jquery/jquery.js"]
				},
				"package/css.css")
				
				s.test.equals(
					res.js,
					'steal.has("a.js","b.js");steal({src:"package/1.js",waits:!0,has:["jquery/jquery.js"]});steal({src:"package/css.css",waits:!0,has:["c.css"]});a;steal.executed("a.js");b;steal.executed("b.js");\n',
					"js works");
					
				s.test.equals(res.css.code,"c")
				
				s.test.clear();
			});
	});

});