steal(
	"funcunit/qunit",
	"steal/preload"
).then(function() {
	
	module("Preload")
	asyncTest( "Requesting two.js which takes two seconds to load.", function() {

		steal.preload("two?sleep=2").done(function() {

			ok( ! window.two, "two.js doesn't exist yet.");

			steal("./two/two?sleep=2").then(function() {

				setTimeout(function(){
					ok( window.two, "Steal loaded two.js instantly from cache.");
					start();
				}, 2500);

			});
		});

	});

});
