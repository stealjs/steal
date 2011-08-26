load('steal/rhino/rhino.js')

steal('steal/test/test.js', function(s) {
//	STEALPRINT = false;
	s.test.module("steal/browser")
	
	var browserTest = function(type){
			s.test.test(type, function(){
				load('steal/rhino/rhino.js')
				steal("steal/browser/"+type, function(){
					var browser = new steal.browser[type]({
						print: true
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
					s.test.clear();
				})
			})
		}, 
		browsers = ["phantomjs", "envjs"]
		
	for(var i=0; i<browsers.length; i++){
		browserTest(browsers[i])
	}
	
//	s.test.test("phantomjs", function(){
//		load('steal/rhino/rhino.js')
//		steal("steal/browser/phantomjs", function(){
//			var browser = new steal.browser.phantomjs({
//				print: true
//			});
//			browser
//				.bind('myevent', function(data){
//					s.test.equals(data.foo, 'bar', 'bind works')
//				})
//				.bind('triggered', function(data){
//					s.test.ok(true, 'injectJS works')
//				})
//				.open('steal/browser/test/mypage.html')
//			var result = browser.evaluate(function(){
//				return MyCo.foo;
//			})
//			s.test.equals(result, "bla", "execute works!")
//			browser.injectJS('steal/browser/test/trigger.js')
//			s.test.expect(3)
//			browser.close();
//		})
//	})
})