steal.plugins('steal/test/qunit').then(function(){
	
	test("join relative", function(){
		
		//ok("true")
		
		equals(new steal.File("a/b/c").joinFrom("d/e"), "d/e/a/b/c", " A relative joinFrom"  ) 
		equals(new steal.File("d/e").join("a/b/c"), "d/e/a/b/c", " A relative join"  ) 
		
		equals(new steal.File("d/e").join("//a/b/c"), "a/b/c", " A // join"  ) 
		
		equals(new steal.File("d/e").join("/a/b/c"), "/a/b/c", " A / join"  ) 
		
		equals(new steal.File("d/e").join("http://javascriptmvc.com/a/b/c"), "http://javascriptmvc.com/a/b/c", " A domain join "  ) 
		
		equals(new steal.File("d/e").join("http://javascriptmvc.com/a/b/c"), "http://javascriptmvc.com/a/b/c", " A file join "  )
		
		equals(new steal.File("../d/e").join("a/b/c"), "../d/e/a/b/c", " A join from a left .."  ) 
		
		equals(new steal.File("d/e").join("../a/b/c"), "d/a/b/c", " A join with a left .."  )
		
		equals(new steal.File("d").join("../a/b/c"), "a/b/c", " A join with a left .."  )
		
		equals(new steal.File("d").join("../../a/b/c"), "../a/b/c", " A join with a left .."  )
		
		
		
		equals(new steal.File("/d").join("../a/b/c"), "/a/b/c", " A join with a left .. on a /"  )
		
		equals(new steal.File("http://abc.com/d").join("../a/b/c"), "http://abc.com/a/b/c", " A join with a left .. on a domain"  )
		
		
		equals(new steal.File("file:///c:/users/Jupiter").join("../a/b/c"), "file:///c:/users/a/b/c", " A join with a left .. on a file"  )
		
		
		equals(new steal.File("file:///c:/users/Jupiter").join("file:///c:/users/Jupiter/a/b"), "a/b", " A join with a left .. on a file"  )
		
		
		equals(new steal.File("a/b").join("http://google.com/here"), "http://google.com/here", "A join with a domain"  )
		// a //
		// a /
		// another domain
		// something with ../../.
		
	})
	
	
})
