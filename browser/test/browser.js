steal('jquery', function(){
	$(document).ready(function(){
		MyCo = {};
		MyCo.foo = "bla";
		steal.client.trigger('myevent', {foo: "bar"});
	})
})