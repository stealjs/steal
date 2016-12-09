var workerURL = steal.config("stealURL") +
	"?main=webworkers/worker&config=" +
	steal.config("configPath");

var worker = new Worker(workerURL);

worker.addEventListener("message", function(ev){
	if(window.QUnit) {
		QUnit.deepEqual(ev.data,  {name: "dep"}, "got a post message");
		QUnit.start();
		removeMyself();
	} else {
		console.log("got message", ev);
	}

});

module.exports = worker;
