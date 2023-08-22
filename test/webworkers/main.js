let workerURL = steal.config("stealURL") +
	"?main=webworkers/worker&config=" +
	steal.config("configPath");

let worker = new Worker(workerURL);

worker.addEventListener("message", function(ev){
	if(window.assert) {
		assert.deepEqual(ev.data,  {name: "dep"}, "got a post message");
		done();
	} else {
		console.log("got message", ev);
	}

});

module.exports = worker;
