steal('jquery', function(){
	console.log("HERE")
	console.log(window.location.href)
	return;
	// sometimes this might load without steal (in funcunit standalone mode)
	if(typeof steal === "undefined"){
		steal = {};
	}
	steal.client = {}
	if (/browser=selenium/.test(window.location.search)) {
		steal.client.dataQueue = []
		steal.client.trigger = function(type, data){
			steal.client.dataQueue.push({
				type: type,
				data: data
			})
		}
	}
	else if (/browser=jstestdriver/.test(window.location.search)) {
		steal.client.trigger = function(type, data){
			var dataString = JSON.stringify(data)
			window.postMessage(dataString, "*")
		}
	}
	else if (/browser=envjs/.test(window.location.search)) {
		steal.client.trigger = function(type, data){
			Envjs.trigger(type, data)
		}
	}
})