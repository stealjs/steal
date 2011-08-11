steal('jquery', function(){
	// sometimes this might load without steal (in funcunit standalone mode)
	if(typeof steal === "undefined"){
		steal = {};
	}
	console.log(window.location.search)
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
	else if (/browser=phantomjs/.test(window.location.search)) {
		if(!$('iframe').length){
			$("<iframe></iframe>").appendTo(document.body)
		}
		steal.client.dataQueue = []
		steal.client.trigger = function(type, data){
			steal.client.dataQueue.push({
				type: type,
				data: data
			})
			if(type == "done"){
				steal.client.phantomexit = true;
			}
		}
		var sender = function(){
			$.get("http://localhost:5555?"+encodeURIComponent(JSON.stringify(steal.client.dataQueue)))
			steal.client.dataQueue = [];
			if(steal.client.phantomexit){
				// kills phantom process
				setTimeout(function(){
					alert('phantomexit')
				}, 100)
			}
			setTimeout(arguments.callee, 200);
		}
		sender();
	}
})