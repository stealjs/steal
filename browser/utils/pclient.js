steal('jquery', function(){
	// sometimes this might load without steal (in funcunit standalone mode)
	if(typeof steal === "undefined"){
		steal = {};
	}
	steal.client = {};
	if(!$('iframe').length){
		$("<iframe></iframe>").appendTo(document.body);
	}
	steal.client.dataQueue = [];
	var id=0;
	steal.client.trigger = function(type, data){
		steal.client.dataQueue.push({
			// workaround
			id: ++id,
			type: type,
			data: data
		});
		if(type == "done"){
			steal.client.phantomexit = true;
		}
	};
	steal.client.sendData = function(){
		var q = steal.client.dataQueue;
		steal.client.dataQueue = [];
		$.ajax({
			url: "http://localhost:5555?" + encodeURIComponent(JSON.stringify(q)),
			cache: true,
			dataType: 'script'
		});
		if (steal.client.phantomexit) {
			// kills phantom process
			setTimeout(function(){
				alert('phantomexit');
			}, 100);
		}
		setTimeout(arguments.callee, 400);
	};
	steal.client.injectJS = function(script){
		console.log('injecting '+script);
	};
	steal.client.evaluate = function(script){
		eval("var fn = "+script);
		var res = fn();
		steal.client.trigger("evaluated", res);
	};
	steal.client.sendData();
})