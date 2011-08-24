steal('steal/browser/client.js', function(){
	setTimeout(function(){
		steal.client.trigger('myevent', {foo: "bar"});
	}, 1000)
})
MyCo = {};
MyCo.foo = "bla";
