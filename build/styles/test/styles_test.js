// load('steal/build/styles/test/styles_test.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('steal/test', function( s ) {
	//STEALPRINT = false;
	s.test.module("steal/build/styles")
	
	STEALPRINT = false;

	s.test.test("css", function(){
		load('steal/rhino/rhino.js');
		steal(
			'steal/build','steal/build/styles',
			function(){
				steal.build('steal/build/styles/test/page.html',
					{to: 'steal/build/styles/test'});
					
				var prod = readFile('steal/build/styles/test/production.css').replace(/\r|\n|\s/g,""),
					expected = readFile('steal/build/styles/test/productionCompare.css').replace(/\r|\n|\s/g,"");
				
				s.test.equals(
					prod,
					expected,
					"css out right");
					
				s.test.clear();
				s.test.remove('steal/build/styles/test/production.css')
			});
	});

	s.test.test("min multiline comment", function(){
		load('steal/rhino/rhino.js');
		steal('steal/build','steal/build/styles',function(){
			var input = readFile('steal/build/styles/test/multiline.css'),
				out = steal.build.builders.styles.min(input);
			
			s.test.equals(out, ".foo{color:blue}", "multline comments wrong")
			
		});
		s.test.clear();
	});
	
	s.test.test("load the same css twice, but only once in prod", function(){
		load('steal/rhino/rhino.js');
		steal('steal/build',
			'steal/build/styles',
			function(){
				steal.build('steal/build/styles/test/app/app.html',
					{to: 'steal/build/styles/test/app'});
			});
		
		var prod = readFile('steal/build/styles/test/app/production.css').replace(/\r|\n/g,"");
		
		s.test.equals(prod,"h1{border:solid 1px black}", "only one css");
			
		s.test.clear();
	});
	
	s.test.test("ensure that data urls aren't relocated", function(){
		load('steal/rhino/rhino.js');
		steal('steal/build',
			'steal/build/styles',
			function(){
				steal.build('steal/build/styles/test/dataurls/dataurls.html',
					{to: 'steal/build/styles/test/dataurls'});
			});
		
		var prod = readFile('steal/build/styles/test/dataurls/production.css').replace(/\r|\n/g,"");
		
		s.test.ok(prod.match(/url\(data:image\/gif/), "data protocol wasn't relocated");
		
		s.test.clear();
	});

	s.test.test("ensure urls references updated correctly after building to a different folder", function(){
		load('steal/rhino/rhino.js');

		// setup where the package will be built to
		var packagePath = 'test_packages/production.css';
		var dest = steal.File(packagePath);
		var packageDir = dest.dir();
		var packageDirFile = steal.File(packageDir);
		if(!packageDirFile.exists()){
			packageDirFile.mkdir();
		}

		// build the package
		steal('steal/build',
			'steal/build/styles',
			function(){
				steal.build('steal/build/styles/test/testurls/testurls.html',
					{to: packageDir});
			});

		// now, check the paths are what we expect.
		var prod = readFile(packagePath);
		s.test.ok(
			prod.match(new RegExp("url\\(\\.\\./steal/build/styles/test/testurls/child/path/image.png\\)")),
			"child path reference correct");
		s.test.ok(
			prod.match(new RegExp("url\\(\\.\\./steal/build/styles/sibling/path/image.png\\)")),
			"sibling path reference correct");
		s.test.ok(
			prod.match(new RegExp("url\\(\\.\\./\\.\\./outside/jsmvcroot/image.png\\)")),
			"external path reference correct");

		// cleanup
		var prodFile = steal.File(packagePath);
		prodFile.remove();
		packageDirFile.removeDir();
		s.test.clear();
	});



});