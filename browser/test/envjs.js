load('steal/rhino/rhino.js')

steal('steal/test/test.js', function(s) {
//	STEALPRINT = false;
	steal.test.module("steal/browser")
	
	steal.test.test("envjs", function(){
		load('steal/rhino/rhino.js')
		steal("steal/browser/envjs")
			var browser = new steal.browser.envjs({
//				print: true
			});
			browser
				.bind('myevent', function(data){
					s.test.equals(data.foo, 'bar', 'bind works')
				})
				.bind('triggered', function(data){
					s.test.ok(true, 'injectJS works')
				})
				.open('steal/browser/test/mypage.html')
			var result = browser.evaluate(function(){
				return MyCo.foo;
			})
			s.test.equals(result, "bla", "execute works!")
			browser.injectJS('steal/browser/test/trigger.js')
			s.test.expect(3)
			browser.close();
	})
})