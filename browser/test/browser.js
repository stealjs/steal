steal('jquery', function(){
	$(document).ready(function(){
		steal.client.trigger('myevent', {foo: "bar"});
	})
})
MyCo = {};
MyCo.foo = "bla";