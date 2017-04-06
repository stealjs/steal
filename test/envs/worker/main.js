var worker = new Worker(steal.loader.stealURL+"?main=envs/worker/worker&config=" + steal.loader.configPath);

worker.addEventListener("message", function(ev){
	if(window.assert) {
		assert.deepEqual(ev.data, {
			platform: "worker",
			env: "development",
			isProduction: false,
			isWorker: true
		}, "got the correct results back");
		done();
	} else {
		console.log("got message", ev.data);
	}

});

module.exports = worker;
