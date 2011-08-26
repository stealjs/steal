steal.client = {};
steal.client.dataQueue = [];
steal.client.trigger = function(type, data){
	steal.client.dataQueue.push({
		type: type,
		data: data
	});
};
steal.client.trigger("clientloaded");