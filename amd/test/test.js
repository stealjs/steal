steal(
	"funcunit/qunit",
	"steal/amd"
).then(function() {
	
	var each = steal.each;

	module("Basics")
	steal.each( ["define", "require"], function( key, value ) {
		test( value + " exists on the window", function(){
			ok( window[ value ] );
		})
	});

	stop();

	module("Define and Require")

	// Defining modules a-e
	define({
		a : true
	});
	define("b", {
		foo: true
	});
	define("c", function() {
		return true;
	});

	define("d", ["a"], function() {
		return true;
	});
	define("e", ["b"], {
		bar: true
	});


	asyncTest( "Requiring a, b, c, d and e", function() {
		require( [ "a", "b", "c", "d", "e" ], function( a, b, c, d, e ) {
			ok( a );
			ok( b.foo );
			ok( c );
			ok( d );
			ok( e.bar );
			start();
		});
	});

	asyncTest( "Requiring e and f - f doesn't exist yet", function() {
		require( [ "e", "f" ], function( e, f ) {
			ok( e );
			ok( f );
			start();
		});
	});


});
