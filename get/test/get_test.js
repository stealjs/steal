load('steal/rhino/steal.js')
load('steal/rhino/test.js');

steal('//steal/get/get',function(rhinoSteal){
	_S = steal.test;
	

	
	_S.module("steal/get")
	// STEALPRINT = false;
	
	_S.test("pluginList", function(t){
		var url = rhinoSteal.get.pluginList("mxui/util/selectable");
		
		t.equals(url, "http://github.com/jupiterjs/mxui/tree/master/util/selectable/", "Right url")
	});
	
	_S.test("pluginUrl", function(t){
		var url = rhinoSteal.get.github.pluginDependenciesUrl("http://github.com/jupiterjs/mxui/tree/master/util/selectable/");
		t.equals(url, "https://github.com/jupiterjs/mxui/raw/master/util/selectable/selectable.js", "Right url");
		
		var url = rhinoSteal.get.github.pluginDependenciesUrl("http://github.com/jupiterjs/mxui/");
		t.equals(url, null, "Nothing if repo form");
		
	})
	
	_S.test("dummySteal", function(t){
		var code = readFile('steal/get/test/stealCode1.js');
		var results = rhinoSteal.dummy(code);
		t.equals(results.plugins[0], "foo/bar", "first is right");
		t.equals(results.plugins.length, 4, "has other plugins")
	});
	
	_S.test("pluginDependencies", function(t){
		var depends = rhinoSteal.get.pluginDependencies("https://github.com/jupiterjs/mxui/raw/master/data/grid/grid.js");

		t.equals(depends[0], "mxui/layout/fill", "first is right");
		t.equals(depends.length, 2, "has other plugins")
	});
	
	_S.test("installDependency", function(t){
		rhinoSteal.File("jqueryui").removeDir();
		//t.equals( rhinoSteal.get.installDependency("jquery/controller") , false, "exists" );
		t.equals( rhinoSteal.get.installDependency("jqueryui/draggable") , true, "doesn't exist" );
		
		
	})
	return;
	_S.test("root repo" , function(t){
		
		rhinoSteal.get('ss/router',{});
		
		var license = readFile("ss/router/LICENSE");
		
		t.ok(license, "srchr downloaded");
		rhinoSteal.File("ss").removeDir();
	});
	
	_S.test("deep repo" , function(t){		
		rhinoSteal.get('srchr',{});
		
		var srchr = readFile("srchr/srchr.html");
		
		t.ok(srchr, "srchr downloaded");
		rhinoSteal.File("srchr").removeDir();
	});
	
	
});

