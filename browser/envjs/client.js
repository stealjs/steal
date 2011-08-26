steal('jquery', function(){
	steal.client = {};
	steal.client.trigger = function(type, data){
		Envjs.trigger(type, data);
	};
}, 'steal/browser/client.js')