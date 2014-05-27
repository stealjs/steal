load('steal/rhino/rhino.js')

steal('steal/test', "steal/generate",'steal/generate/system.js',function(s){
	_S = steal.test;
	
	_S.module("steal/generate")
	//turn off printing
	_S.test("convert", function(){
		
		var res = s.generate.convert("cookbook/models/recipe_thang")
		
		_S.equals(res.appName, "cookbook", "appName is right");
		_S.equals(res.appPath, "cookbook", "appPath is right");
		_S.equals(res.Alias, "RecipeThang", "Alias is right");
		_S.equals(res.alias, "recipeThang", "alias is right");
		_S.equals(res._alias, "recipe_thang", "_alias is right");
		_S.equals(res.pluralAlias, "recipeThangs", "pluralAlias is right");
		_S.equals(res.path, "cookbook/models/recipe_thang/recipe_thang.js");
		_S.equals(res.module, "cookbook/models/recipe_thang");
		_S.equals(res.parentModule, "cookbook/models");
		
		var res = s.generate.convert("company/cookbook/models/recipe_thang")
		_S.equals(res.appName, "cookbook", "appName is right");
		_S.equals(res.appPath, "company/cookbook", "appPath is right");
	})
	
	_S.test("generate basic foo app", function(){
		
		var	data = steal.extend({
			path: "foo", 
			application_name: "foo",
			current_path: steal.File.cwdURL(),
			path_to_steal: new steal.File("foo").pathToRoot()
		}, steal.system);
		steal.generate("steal/generate/templates/app","foo",data)
		
		steal.File("foo").removeDir();
		
	});
	var clean = function(str){
		return str.replace(/\r|\n|\s/g,"");
	}
	_S.test("_insertSteal",function(){
		var insert = s.generate._insertSteal;
		var tests = {
			"blank file": 			["","foo",{name: "foo"},"steal('foo',function(foo){});"],
			"blank file, no name":  	["","foo",{},"steal('foo');"],
			"empty steal": 			["steal()","foo",{name: "foo"},"steal('foo',function(foo){})"],
			"empty steal, no name": 	["steal()","foo",{},"steal('foo')"],
			"single steal, no function": 
									["steal('bar')",'foo',{name: "foo"},"steal('foo','bar',function(foo){})"],
			"mixed steals with function":
									["steal('bar','car',function(bar){})",'foo',{name:'foo'},
									 "steal('bar','foo','car',function(bar,foo){})"],
			"starts with a function": ["steal(function(){})",'foo',{name:'foo'},
									  "steal('foo',function(foo){})"],
			"starts with a function, no name": ["steal(function(){})",'foo',{},
									  "steal('foo',function(){})"],
			"module, function, no name": ["steal('foo',function(){})",'bar',{},
									  "steal('foo','bar',function(){})"]
		};
		for(var assertName in tests){
			var test = tests[assertName],
				args = test.slice(0),
				expected = test.pop(),
				res = clean(insert.apply(s.generate, args));
			_S.equals(res, expected, assertName);
		}
	})

	
	/**
	 * Tests 4 cases:
	 * 1. steal(function(){})
	 * 2. steal("foo", function(){})
	 * 3. steal("foo")
	 * 4. no steal in the page initially
	 */
	s.test.test("insertSteal", function(){
		var testFile = "steal/generate/test/insertSteal.js",
			expectedFile = "steal/generate/test/insertStealExpected.js"
		
		// make blank file
		steal.File(testFile).save("steal(function(){})");
		steal.generate.insertSteal(testFile,"foo");
		steal.generate.insertSteal(testFile,"bar");
		
		var res = readFile(testFile).replace(/\r|\n|\s/g,""),
			expected = "steal('foo','bar',function(){})"
		s.test.equals(res, expected, "insertSteal is working");
		s.test.remove(testFile)
		
		steal.File(testFile).save("steal('foo')");
		steal.generate.insertSteal(testFile,"bar");
		
		var res = readFile(testFile).replace(/\r|\n|\s/g,""),
			expected = "steal('foo','bar')"
			
		s.test.equals(res, expected, "insertSteal is working");
		s.test.remove(testFile)
		
	});
	
})