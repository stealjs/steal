steal('jquery', function(){
	if(!$('iframe').length){
		$("<iframe></iframe>").appendTo(document.body);
	}
	steal.client = {}
	steal.client.dataQueue = []
	var id=0, 
		executed = {};
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
//		console.log('SENDING: '+params)
		$.ajax({
			url: "http://localhost:5555?" + params,
			cache: false,
			dataType: 'jsonp',
			jsonp: false,
			jsonpCallback: 'cb',
			success: function(resp){
				var id = resp.id, 
					fn = resp.fn;
				setTimeout(steal.client.sendData, 400);
				// duplicate for some reason
				if (executed[id]) {
//					console.log('DUPLICATE: '+id)
					return;
				}
				fn();
				executed[id] = true;
				if (steal.client.phantomexit) {
					// kills phantom process
					setTimeout(function(){
						alert('phantomexit')
					}, 100)
				}
			}
		})
	}
	steal.client.evaluate = function(script){
		eval("var fn = "+script);
		var res = fn();
//		console.log('EVAL: '+script)
//		console.log('returnVal: '+res)
		steal.client.trigger("evaluated", res)
	};
	setTimeout(steal.client.sendData, 1000);
}, 'steal/browser/client.js')
