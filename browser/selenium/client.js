steal('jquery', function(){
	steal.client = {};
	steal.client.dataQueue = [];
	steal.client.trigger = function(type, data){
		steal.client.dataQueue.push({
			type: type,
			data: data
		});
	};
}, 'steal/browser/client.js')