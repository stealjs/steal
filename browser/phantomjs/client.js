steal('jquery', function(){
	steal.client = {}
	steal.client.dataQueue = []
	var id=0;
	steal.client.trigger = function(type, data){
//		console.log('TYPE: '+type+", data: "+data)
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
//		console.log('SENDING: '+params)
		$.ajax({
			url: "http://localhost:5555?" + params,
			cache: false,
			dataType: 'jsonp',
			jsonp: false,
			jsonpCallback: 'cb',
			success: function(resp){
				setTimeout(steal.client.sendData, 400);
				if(resp){
					var res = resp.fn();
					steal.client.trigger('evaluated', res);
				}
				if (steal.client.phantomexit) {
					// kills phantom process
					setTimeout(function(){
						alert('phantomexit')
					}, 100)
				}
			}
		})
	}
	steal.client.evaluate = function(script, arg){
		eval("var fn = "+script);
		var res = fn(arg);
		return res;
	};
	setTimeout(steal.client.sendData, 1000);
}, 'steal/browser/client.js')
