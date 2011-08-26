steal('jquery', function(){
	if(!$('iframe').length){
		$("<iframe></iframe>").appendTo(document.body)
	}
	steal.client = {}
	steal.client.dataQueue = []
	var id=0;
	steal.client.trigger = function(type, data){
		steal.client.dataQueue.push({
			// workaround
			id: ++id,
			type: type,
			data: data
		})
		if(type == "done"){
			steal.client.phantomexit = true;
		}
	}
	steal.client.sendData = function(){
		var q = steal.client.dataQueue;
		steal.client.dataQueue = [];
		var params = encodeURIComponent(JSON.stringify(q));
//		console.log(params)
		$.ajax({
			url: "http://localhost:5555?" + params,
			cache: true,
			dataType: 'script'
		})
		if (steal.client.phantomexit) {
			// kills phantom process
			setTimeout(function(){
				alert('phantomexit')
			}, 100)
		}
		setTimeout(arguments.callee, 400);
	}
	steal.client.evaluate = function(script){
		eval("var fn = "+script);
		var res = fn();
		steal.client.trigger("evaluated", res)
	}
	steal.client.sendData();
}, 'steal/browser/client.js')
