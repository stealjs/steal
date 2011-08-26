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
							var result = this.evaluate(function(){
								return MyCo.foo;
							})
							s.test.equals(result, "bla", "execute works!")
							this.close();
						})
						.bind('triggered', function(data){
							s.test.ok(true, 'injectJS works')
						})
						// triggered after steal/browser/selenium/client.js has loaded
						.bind('clientloaded', function(){
							this.injectJS('steal/browser/test/trigger.js')
						})
						.open('steal/browser/test/mypage.html')
					s.test.expect(3)
					s.test.clear();
				})
			})
		}, 
		browsers = ["phantomjs", "envjs"]
//		browsers = ["selenium"]
		
	for(var i=0; i<browsers.length; i++){
		browserTest(browsers[i])
	}
	
})