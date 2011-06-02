steal.plugins('funcunit/qunit').then(function(){
	
	var orig = steal.File( steal.root.path );
		src = function(src){
		return orig.join(src)
	},
	bId = function(id){
		return document.getElementById(id);
	};
	
	module("steal");
	
	
	
test("domain", function() {
	equals(null, new steal.File("file://C:/Development").domain(), "problems from file")
	equals('something.com', new steal.File('http://something.com/asfdkl;a').domain(), "something.com is the correct http domain.")
	equals('127.0.0.1:3006', new steal.File('https://127.0.0.1:3006/asdf').domain(), "something.com is the correct https domain.")
})

test("joinFrom", function() {
	var result;
	equals(
	steal.File('a/b.c').joinFrom('/d/e'), "/d/e/a/b.c", "/d/e/a/b.c is correctly joined.");

	result = new steal.File('a/b.c').joinFrom('d/e');
	equals(result, "d/e/a/b.c", "d/e/a/b.c is correctly joined.");

	result = new steal.File('a/b.c').joinFrom('d/e/');
	equals(result, "d/e/a/b.c", "d/e/a/b.c is correctly joined.");

	result = new steal.File('a/b.c').joinFrom('http://abc.com');
	equals(result, "http://abc.com/a/b.c", "http://abc.com/a/b.c is correctly joined.");

	result = new steal.File('/a/b.c').joinFrom('http://abc.com');
	equals(result, "http://abc.com/a/b.c", "http://abc.com/a/b.c is correctly joined.");

	result = new steal.File('a/b.c').joinFrom('http://abc.com/');
	equals(result, "http://abc.com/a/b.c", "http://abc.com/a/b.c is correctly joined.");

	result = new steal.File('/a/b.c').joinFrom('http://abc.com/');
	equals(result, "http://abc.com/a/b.c", "http://abc.com/a/b.c is correctly joined.");

	result = new steal.File('a/b.c').joinFrom('../d/e');
	equals(result, "../d/e/a/b.c", "../d/e/a/b.c is correctly joined.");

	result = new steal.File('a/b.c').joinFrom('');
	equals(result, "a/b.c", "a/b.c is correctly joined.");

	result = new steal.File('/a/b.c').joinFrom('');
	equals(result, "/a/b.c", "/a/b.c is correctly joined.");
	
	
	result = new steal.File('../../up.js').joinFrom('cookbook/')
	equals(result, "../up.js", "up.js is correctly joined.")
})

test("dir", function() {
	equals("/a/b/c", new steal.File("/a/b/c/cookbook.html").dir(), "/a/b/c dir is correct.")
	equals("a/b/c", new steal.File("a/b/c/cookbook.html").dir(), "a/b/c dir is correct.")
	equals("../a/b/c", new steal.File("../a/b/c/cookbook.html").dir(), "../a/b/c dir is correct.")
	equals("http://127.0.0.1:3007", new steal.File("http://127.0.0.1:3007/cookbook.html").dir(), "http://127.0.0.1:3007 dir is correct.")
})

test("File.clean", function() {
	result = new steal.File('http://abc.com#action').clean();
	equals(result, "http://abc.com", "http://abc.com#action is correctly cleaned.");

	result = new steal.File('http://abc.com#action&q=param').clean();
	equals(result, "http://abc.com", "http://abc.com#action&q=param is correctly cleaned.");

	result = new steal.File('http://abc.com/#action&q=param').clean();
	equals(result, "http://abc.com/", "http://abc.com/#action&q=param is correctly cleaned.");

	result = new steal.File('a/b/#action&q=param').clean();
	equals(result, "a/b/", "a/b/#action&q=param is correctly cleaned.");

	result = new steal.File('a/b#action&q=param').clean();
	equals(result, "a/b", "a/b#action&q=param is correctly cleaned.");
})

test("File.protocol", function() {
	result = new steal.File('http://abc.com').protocol();
	equals(result, "http:", "http://abc.com protocol should be http:.");

	result = new steal.File('https://abc.com').protocol();
	equals(result, "https:", "https://abc.com protocol should be https:.");

	result = new steal.File('file://a/b/c').protocol();
	equals(result, "file:", "file://a/b/c protocol should be file:.");

	result = new steal.File('file:///a/b/c').protocol();
	equals(result, "file:", "file:///a/b/c protocol should be file:.");
})

test("File.join", function() {
	result = new steal.File("http://abc.com").join("/a/b/c");
	equals(result, "http://abc.com/a/b/c", "http://abc.com/a/b/c was joined successfuly.");

	result = new steal.File("http://abc.com/").join("/a/b/c");
	equals(result, "http://abc.com/a/b/c", "http://abc.com/a/b/c was joined successfuly.");

	result = new steal.File("http://abc.com/").join("a/b/c");
	equals(result, "http://abc.com/a/b/c", "http://abc.com/a/b/c was joined successfuly.");

	result = new steal.File("http://abc.com").join("a/b/c");
	equals(result, "http://abc.com/a/b/c", "http://abc.com/a/b/c was joined successfuly.");

	result = new steal.File("a/b/c").join("d/e");
	equals(result, "a/b/c/d/e", "a/b/c/d/e was joined successfuly.");

	result = new steal.File("a/b/c/").join("d/e");
	equals(result, "a/b/c/d/e", "a/b/c/d/e was joined successfuly.");

	result = new steal.File("a/b/c/").join("/d/e");
	equals(result, "/d/e", "/d/e was joined successfuly.");

	result = new steal.File("a/b/c").join("/d/e");
	equals(result, "/d/e", "/d/e was joined successfuly.");
});



test("File.relative", function() {
	result = new steal.File("a/b/c").relative();
	ok(result, "a/b/c is relative.")

	result = new steal.File("/a/b/c").relative();
	ok(!result, "/a/b/c is NOT relative.")
})

test("File.isLocalAbsolute", function() {
	result = new steal.File("/a/b/c").isLocalAbsolute();
	ok(result, "/a/b/c is absolute.")

	result = new steal.File("a/b/c").isLocalAbsolute();
	ok(!result, "a/b/c is NOT absolute.")
})

test("File.isDomainAbsolute()", function() {
	var result = new steal.File("http://abc.com/d/e").protocol();
	ok(result, "http://abc.com/d/e domain is absolute.")

	result = new steal.File("http://abc.com/d/e/").protocol();
	ok(result, "http://abc.com/d/e/ domain is absolute.")

	result = new steal.File("https://abc.com/d/e").protocol();
	ok(result, "https://abc.com/d/e domain is absolute.")

	result = new steal.File("https://abc.com/d/e/").protocol();
	ok(result, "https://abc.com/d/e/ domain is absolute.")

	result = new steal.File("file://a/b/c/d/e").protocol();
	ok(result, "file://a/b/c/d/e domain is absolute.")

	result = new steal.File("file://a/b/c/d/e/").protocol();
	ok(result, "file://a/b/c/d/e/ domain is absolute.")

	result = new steal.File("file:///a/b/c/d/e").protocol();
	ok(result, "file:///a/b/c/d/e domain is absolute.");

	result = new steal.File("/a/b/c/d/e").protocol();
	ok(!result, "/a/b/c/d/e domain is absolute.");
})

test("File.afterDomain", function() {
	result = new steal.File("http://abc.com/d/e").afterDomain();
	equals(result, "/d/e", "/d/e is the correct after domain result.");
})

test("File.toReferenceFromSameDomain()", function() {
	result = new steal.File("http://abc.com/d/e").toReferenceFromSameDomain("http://abc.com/d/e/f/g/h");
	equals(result, "../../../", "../../../ is the correct reference from same domain result.");

	result = new steal.File("http://abc.com/d/e/x/y").toReferenceFromSameDomain("http://abc.com/d/e/f/g/h");
	equals(result, "../../../x/y", "../../../x/y is the correct reference from same domain result.");

	result = new steal.File("a/b/c/x/y").toReferenceFromSameDomain("a/b/c/d/e");
	equals(result, "../../x/y", "../../x/y is the correct reference from same domain result.");

	result = new steal.File("a/b/c/d/e").toReferenceFromSameDomain("a/b/c/d/e");
	equals(result, "", "'' is the correct reference from same domain result.");
})

test("File.normalize", function() {
	steal.File.cur("/a/b/");
	result = new steal.File("c/d").normalize();
	equals(result, "/a/b/c/d", "/a/b/c/d was normalized successfuly.");

	steal.File.cur("/a/b/c");
	result = new steal.File("//d/e").normalize();
	equals(result, "d/e", "d/e was normalized successfuly.");

	steal.File.cur("/a/b/c");
	result = new steal.File("/d/e").normalize();
	equals(result, "/d/e", "/d/e was normalized successfuly.");

	steal.File.cur("http://abc.com");
	result = new steal.File("d/e").normalize();
	equals(result, "http://abc.com/d/e", "http://abc.com/d/e was normalized successfuly.");

	steal.File.cur("http://abc.com");
	result = new steal.File("/d/e").normalize();
	equals(result, "http://abc.com/d/e", "http://abc.com/d/e was normalized successfuly.");
});

test("File.ext", function(){
	equals("", steal.File("").ext())
	equals("", steal.File("asdfas.asfa/safda").ext())
	equals("com", steal.File("asdfas.asfa/safda.com").ext())
})

	test("rootSrc", function(){
		steal.rootUrl("../abc/");
		equals( steal.File.cur().path , "../../qunit.html", "cur changed right");
		
	})

	test("request async", function(){
		stop(1000);
		var count = 0;
		steal.request({
			src : src('steal/tests/files/something.txt?' + Math.random())  // add random to force IE to behave
		}, function(txt){
			equals(txt,  "Hello World", "world is hello")
			start();
			count++;
		})
		equals(count, 0);
	});
	
	test("request async error", function(){
		stop();
		var count = 0;
		steal.request({
			src : src('steal/tests/files/a.txt')
		}, function(txt){
			ok(false,  "I should not be here")
			start();
			count++;
		},function(){
			ok(true, "I got an error");
			start();
			count++;
		})
		equals(count, 0);
	});
	
	test("request sync", function(){
		stop();
		var count = 0;
		steal.request({
			src : src('steal/tests/files/something.txt'),
			async: false
		}, function(txt){
			equals(txt,  "Hello World", "world is hello")
			start();
			count++;
		})
		equals(count, 1);
	});
	
	
	
	test("require JS", function(){
		stop();
		steal.require({
			src : src('steal/tests/files/require.js'),
			type: "js"
		},{}, function(){
			start();
			ok(REQUIRED, "loaded the file")
		})
	});
	
	test("require CSS", function(){
		stop();
		steal.require({
			src : src('steal/tests/files/require.css'),
			type: "css"
		},{}, function(){
			start();
			ok( bId('qunit-header').clientHeight > 65, "Client height changed to "+bId('qunit-header').clientHeight );
			
		})
	});
	
	test("require weirdType", function(){
		stop();
		
		steal.type("foo js", function(options, original, success, error){
			var parts = options.text.split(" ")
			options.text = parts[0]+"='"+parts[1]+"'";
			success();
		});
		
		steal.require({
			src : src('steal/tests/files/require.foo'),
			type: "foo"
		},{}, function(){
			start();
			equals(REQUIRED,"FOO", "loaded the file")
			
		})
	});
			
	// this has to be done via a steal request instead of steal.require
	// because require won't add buildType.  Require just gets stuff
	// and that is how it should stay.
//	test("buildType set", function(){
//		stop();
//		
//		steal.type("foo js", function(options, original, success, error){
//			var parts = options.text.split(" ")
//			options.text = parts[0]+"='"+parts[1]+"'";
//			success();
//			equals(options.buildType, "js", "build type set right");
//			equals(options.type, "foo", "type set right");
//		});
//		
//		steal({
//			src : src('steal/tests/files/require.foo'),
//			type: "foo"
//		},function(){
//			start();
//		})
//	});
	
	test("when", function(){
		var count = 0,
			ob1 = {
				loaded : function(){},
				path: "ob1"
			},
			ob2 = {
				loaded : function(){},
				path: "ob2"
			},
			ob3 = {
				complete : function(){
					count++;
					steal.when(ob2,"loaded", ob4,"complete");
				},
				path: "ob3"
			},
			when = steal.when,
			ob4 = {
				complete : function(){
					count++;
					equals(count, 2, "complete called again")
					
					steal.when(ob3,"complete",ob5,"complete");
				},
				path: "ob4"
			},
			ob5 = {
				complete : function(){
					count++;
					equals(count,3, "complete called on another 'finished' complete");
					start();
				},
				path: "ob5"
			}
		
		stop(1000);
		steal.when(ob1,"loaded", ob2,"loaded" ,ob3,"complete");
		ob1.loaded();
		ob2.loaded();
		
	});
	
	test("when Async", function(){
		var count = 0,
			ob1 = {
				loaded : function(){},
				path: "ob1"
			},
			ob2 = {
				loaded : function(){},
				path: "ob2"
			},
			ob3 = {
				complete : function(){
					count++;
					steal.when(ob2,"loaded", ob4,"complete");
				},
				path: "ob3"
			},
			when = steal.when,
			ob4 = {
				complete : function(){
					count++;
					equals(count, 2, "complete called again")
					
					steal.when(ob3,"complete",ob5,"complete");
				},
				path: "ob4"
			},
			ob5 = {
				complete : function(){
					count++;
					equals(count,3, "complete called on another 'finished' complete");
					start();
				},
				path: "ob5"
			};
			
		stop(1000);
		steal.when(ob1,"loaded", ob2,"loaded" ,ob3,"complete");
		
		setTimeout(function(){
			ob1.loaded();
		},10)
		setTimeout(function(){
			ob2.loaded();
		},10)
		
	});
	
	test("when nothing is waiting", 1, function(){
		var ob = {
			complete : function(){
				ok(true, "run right away")
			}
		};
		
		steal.when(ob, "complete");
	});
	
	test("AOP normal", function(){
		var order = [],
			before = function(){
				order.push(1)
			},
			after = function(){
				order.push(2)
			};
		before = steal._before(before , function(){
			order.push(0)
		});
		after = steal._after(after , function(){
			order.push(3)
		})
		before();
		after();
		same(order, [0,1,2,3])
	})
	
	test("AOP adjust", function(){
		var order = [],
			before = function(arg){
				equal(arg,"Changed","modified original");
				order.push(1)
			},
			after = function(){
				order.push(2);
				return "OrigRet"
			};
		before = steal._before(before , function(arg){
			order.push(0);
			equal(arg,"Orig","retrieved original");
			return ["Changed"]
		}, true);
		after = steal._after(after , function(ret){
			order.push(3)
			equal(ret,"OrigRet","retrieved original");
			return "ChangedRet"
		}, true)
		before("Orig");
		var res = after();
		equal(res,"ChangedRet","updated return");
		same(order, [0,1,2,3])
	})
	
	test("steal one js", function(){
		// doesn't this imply the next ...
		steal.rootUrl("../../");
			 
		stop(1000);
		
		steal("files/steal", function(){
			start();
			equals(REQUIRED,"steal", "loaded the file")
		})
	})
	
	
	
	test("steal one file with different rootUrl", function(){
		// doesn't this imply the next ...
		steal.rootUrl("../");
		REQUIRED = undefined;
		stop(1000);
		
		// still loading relative to the page
		steal("files/steal", function(){
			start();
			equals(REQUIRED,"steal", "loaded the file")
		})
	})
	
	
	test("steal one file with different cur", function(){
		// doesn't this imply the next ...
		steal.rootUrl("../../")
			.cur("foo/bar.js");
		REQUIRED = undefined;
		stop(1000);
		
		// still loading relative to the page
		steal("../steal/tests/files/steal", function(){
			start();
			equals(REQUIRED,"steal", "loaded the file")
		})
	});
	
	test("steal one function", function(){
		steal.rootUrl("../../")
			.cur("foo/bar.js");
		
		stop(1000);
		steal(function(){
			start();
			ok(true, "function called")
		})
	})
	
	test("loading two files", function(){
		ORDER = [];
		stop(1000);
		steal.rootUrl("../../").then('files/file1',function(){
			same(ORDER,[1,2,"then2","then1"])
			start();
		})
	})
	
	test("loading same file twice", function(){
		ORDER = [];
		stop(1000);
		steal.rootUrl("../../").then('files/duplicate', 'files/duplicate',function(){
			same(ORDER,[1])
			start();
		})
	})
	
	test("loading same file twice with absolute paths", function(){
		ORDER = [];
		stop(1000);
		steal.rootUrl("../../").then('files/loadDuplicate').then('//steal/tests/files/duplicate',function(){
			same(ORDER,[1])
			start();
		})
	})
	
	test("getScriptOptions", function(){
		var script = document.createElement('script'),
			F = steal.File;
		script.src= "../../steal/steal.js?foo";
		var url = F(script.src).protocol() ?  F( F(script.src).dir() ).dir()+"/"  : "../../";
		
		var options = steal.getScriptOptions(script);
		
		equals(options.rootUrl, url,"root url is right");
		equals(options.app,"foo","app right");
		
		script.src = "../steal.js?bar.js";

		options = steal.getScriptOptions(script);
		
		url = F(script.src).protocol() ?   F( F(script.src).dir() ).dir()+"/" : "../../";
		
		equals(options.rootUrl, url,"root url is right");
		equals(options.startFile,"bar.js","app right");
		
	})
})
