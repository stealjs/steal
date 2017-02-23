
var worker = new Worker(System.stealURL+"?main=worker/worker&config=test/npm/package.json!npm");

worker.addEventListener("message", function(ev){
	if(window.QUnit) {
		QUnit.deepEqual(ev.data,  {name: "dep"}, "got a post message");
		removeMyself();
	} else {
		console.log("got message", ev);
	}

});

module.exports = worker;
