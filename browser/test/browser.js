steal('steal/browser/client.js', function(){
	steal.client.trigger('myevent', {foo: "bar"})
})