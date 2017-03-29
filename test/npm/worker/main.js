
var worker = new Worker(System.stealURL+"?main=worker/worker&config=test/npm/package.json!npm");

worker.addEventListener("message", function(ev){
	if(window.assert) {
		assert.deepEqual(ev.data,  {name: "dep"}, "got a post message");
		done();
	} else {
		console.log("got message", ev);
	}

});

module.exports = worker;
