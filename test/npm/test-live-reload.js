QUnit.module("live-reload behavior");


var makeIframe = function(src){
	var iframe = document.createElement('iframe');
	window.removeMyself = function(){
		delete window.removeMyself;
		document.body.removeChild(iframe);
		QUnit.start();
	};
	document.body.appendChild(iframe);
	iframe.src = src;
};

asyncTest("can install something", function(){
	makeIframe("live-reload/dev.html");
});

QUnit.start();
