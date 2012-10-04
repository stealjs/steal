module("AMD");

test('steal.id', function(){
	equal(steal.id("foo/bar") + "", "foo/bar/bar.js");
	equal(steal.id("./baz", "foo/bar") + "", "foo/baz.js");
	equal(steal.id("../baz", "foo/bar") + "", "baz.js");
	steal.config({
		map: {
			'*' : {
				"foo/bar": "http://localhost/foo/foo/bar"
			}
		}
	})
	equal(steal.id("foo/bar") + "", "http://localhost/foo/foo/bar/bar.js");
});

test('steal.amdToId', function(){
	steal.config({
		map: {
			'*' : {
				"http://localhost/foo/foo/bar": "foo/bar"
			}
		}
	})
	equal(steal.amdToId("http://localhost/foo/foo/bar") + "", "foo/bar")
});

test('steal.idToUri', function(){
	steal.config({
		paths: {
			"foo/baz" : "http://localhost/foo/baz/baz.js"
		}
	})
	equal(steal.idToUri("foo/baz"), "http://localhost/foo/baz/baz.js")
});

test('steal.amdIdToUri', function(){
	steal.config({
		paths: {
			"baz/foo/" : "http://localhost/foo/baz/baz.js"
		}
	})
	equal(steal.amdIdToUri("baz/foo/"), "http://localhost/foo/baz/baz.js")
});