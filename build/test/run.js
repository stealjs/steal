// load('steal/build/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */

load('steal/build/pluginify/test/pluginify_test.js')
load('steal/build/js/js_test.js')
load('steal/build/open/test/open_test.js')
load('steal/build/css/test/css_test.js')
load('steal/build/packages/test/packages_test.js')

load('steal/rhino/rhino.js')
steal('steal/test/test.js', function( s ) {
	STEALPRINT = false;
	s.test.module("steal/build")
	
	s.test.test("steal.dev removes parens", function(){
		load('steal/rhino/rhino.js')
		var dev = readFile('steal/build/test/dev.js'),
			devCleaned = readFile('steal/build/test/devCleaned.js');
		steal("steal/build","steal/build/js").then(function(s2){
			var a = steal.build.js.clean("var bla;var foo;steal.dev.log('hi')")
			s.test.equals(a, "var bla;var foo;", "clean works")
			var b = steal.build.js.clean("var bla;steal.dev.log('hi()');var foo;steal.dev.log('onetwo(bla())')")
			s.test.equals(b, "var bla;;var foo;", "clean works with parens")
			var c = steal.build.js.clean("var bla;steal.dev.warn('hi()');var foo;steal.dev.warn('onetwo(bla())')")
			s.test.equals(b, "var bla;;var foo;", "clean works with warn")
			var d = steal.build.js.clean(dev);
			s.test.equals(d, devCleaned, "clean really works")
		});
		s.test.clear();
	})
	
	s.test.test("less packages correctly", function(){
		load('steal/rhino/rhino.js')
		steal("steal/build","steal/build/js","steal/build/css", "steal/build/apps").then(function(s2){
			s2.build("steal/build/test/styles/styles.html", {
				to: 'steal/build/test/styles'
			})
		});
		// will throw an error if its not working
		AFTERLESS = false;
		s.test.open('steal/build/test/styles/prod.html');
		s.test.equals(document.getElementsByTagName("link").length, 1, "there is one css in the page")
		s.test.equals(document.getElementsByTagName("link")[0].href.indexOf("production.css") != -1, true, "its the production.css")
		s.test.equals(AFTERLESS, true, "the callback function runs")
		
		// this page tests putting link in the head
		AFTERLESS = false;
		s.test.open('steal/build/test/styles/prod2.html');
		s.test.equals(document.getElementsByTagName("link").length, 1, "there is one css in the page")
		s.test.equals(document.getElementsByTagName("link")[0].href.indexOf("production.css") != -1, true, "its the production.css")
		s.test.equals(AFTERLESS, true, "the callback function runs")
		s.test.clear();
		// s.test.remove('steal/build/test/styles/production.js')
		// s.test.remove('steal/build/test/styles/production.css')
		
	});
	
	s.test.test("open", function(){
		load('steal/rhino/rhino.js')
		steal("steal/build").then(function(newSteal){
			var count = 0;
			newSteal.build.open("steal/build/test/stealpage.html", function(scripts){
				scripts.each(function(options){
					count++;
					s.test.equals(options.text.length > 1, true, "No content from "+options.src)
				})
			})
			s.test.equals(count, 4, "Basic source not right number")
			
		});
		s.test.clear();
	});
	
	s.test.test("using stealjs", function(){
		load('steal/rhino/rhino.js')
		steal("steal/build","steal/build/js").then(function(s2){
			s2.build("steal/build/test/stealpage.html", {
				to: 'steal/build/test'
			})
		});
		
		s.test.clear();
		s.test.open('steal/build/test/stealprodpage.html')
		var res = ["0","1","2"]
		s.test.equals(packagesStolen.length, res.length, "Lengths not equal");
		for(var i=0; i < res.length; i++){
			s.test.equals(packagesStolen[i],res[i])
		}
		s.test.clear();
	
		s.test.remove('steal/build/test/production.js')
		
	});

	
	s.test.test("jquery ready code doesn't run", function(){
		load('steal/rhino/rhino.js')
		steal("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/jqueryready.html", {
				to: 'steal/build/test'
			})
		});
		
		s.test.equals(jqueryReadyCodeRun, false, "document ready code not called");
		s.test.clear();
		s.test.remove('steal/build/test/production.js')
		
	});

	
	// test that production created successfully
	// this test has zero assertions
	// if it fails no production file will be created so it will error
	s.test.test("duplicate dependencies don't finish early", function(){
		load('steal/rhino/rhino.js')
		steal("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/circular/circular.html", {
				to: 'steal/build/test/circular'
			})
		});
		s.test.open('steal/build/test/circular/prod.html');
		s.test.remove('steal/build/test/circular/production.js')
		s.test.clear();
		
	});
	
	s.test.test("exclude files", function(){
		load('steal/rhino/rhino.js')
		steal("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/circular/circular.html", {
				to: 'steal/build/test/circular',
				exclude: ['steal/build/test/circular/fileB.js', 'jquery/jquery.js']
			})
		});
		s.test.clear();
		var prod = readFile("steal/build/test/circular/production.js");
		
		s.test.equals(/steal\/build\/test\/circular\/fileB/.test(prod), false, "fileB.js is not included");
		s.test.remove('steal/build/test/circular/production.js')
		s.test.clear();
		
	});
	
    var setupMultiBuild = function(after) {
        /**
         * Setup for multi-build packaging tests
         *
         * Project module dependency diagram:
         *
         * app_x           app_y         app_z
         *
         *  ^          7    ^           7   ^
         *  |        /      |         /     |
         *  |      /        |       /       |
         *
         * plugin_xy       plugin_yz     plugin_z
         *
         *  ^             7
         *  |           /
         *  |         /
         *
         * nested_plugin_xyz
         *
         *
         * Modules should be grouped up into packages, based upon shared
         * dependencies. The packages should be structured as follows:
         *
         * packages/0 -> (contains) -> nested_plugin_xyz
         *
         * packages/1 -> (depends on) -> packages/0 for nested_plugin_xyz
         *            -> (contains) -> plugin_xy
         *
         *
         * packages/2 -> (depends on) -> packages/0 for nested_plugin_xyz
         *            -> (contains) -> plugin_yz
         *
         * app_x/production -> (loads) -> packages/0 for nested_plugin_xyz
         *                  -> (loads) -> packages/1 for plugin_xy
         *                  -> (contains) -> app_x
         *
         * app_y/production -> (loads) -> packages/0 for nested_plugin_xyz
         *                  -> (loads) -> packages/1 for plugin_xy
         *                  -> (loads) -> packages/2 for plugin_yz
         *                  -> (contains) -> app_y
         *
         * app_z/production -> (loads) -> packages/0 for nested_plugin_xyz
         *                  -> (loads) -> packages/2 for plugin_yz
         *                  -> (contains) -> plugin_z
         *                  -> (contains) -> app_z
         *
         * This test multi-build project will allow testing of a few cases:
         * - Packaging a direct dependency
         * - Packaging an indirect dependency (dependency of another dependency)
         * - Packaging an indirect dependency once, when it is imported more than once
         * - Including a direct dependency
         *   (plugin_z, because it is only imported in one app module)
         *
         */

        load('steal/rhino/rhino.js');
        steal("steal/build","steal/build/scripts","steal/build/styles", "steal/build/apps").then(function(s2){

            var buildOptions = {
                // compressor: "uglify" // uglify is much faster
            };

            // @todo: Work out why STEALPRINT doesn't prevent print() statements
            //        during build
            // STEALPRINT = false;

            s2.build.apps(["steal/build/test/multibuild/app_x",
                           "steal/build/test/multibuild/app_y",
                           "steal/build/test/multibuild/app_z"], buildOptions);
            // Clear after running build
            s.test.clear();

            // Execute callback
            after();

            // Tear down
            s.test.clear();
            s.test.remove("steal/build/test/multibuild/app_x/production.js");
            s.test.remove("steal/build/test/multibuild/app_y/production.js");
            s.test.remove("steal/build/test/multibuild/app_z/production.js");
            s.test.remove("steal/build/test/multibuild/app_x/production.css");
            s.test.remove("steal/build/test/multibuild/app_y/production.css");
            s.test.remove("steal/build/test/multibuild/app_z/production.css");
            s.test.remove("packages/0.js");
            s.test.remove("packages/1.js");
            s.test.remove("packages/2.js");
            s.test.remove("packages/0.css");
            s.test.remove("packages/1.css");
            s.test.remove("packages/2.css");
        });
    };

    s.test.test("multibuild creates JS/CSS packages with the right contents", function(){
        setupMultiBuild(function(){
            var contents;
            contents = readFile("packages/steal_build_test_multibuild_app_x-steal_build_test_multibuild_app_y-steal_build_test_multibuild_app_z.js");
            s.test.equals(/init_nested_plugin_xyz/.test(contents), true,
                    "content of nested_plugin_xyz.js should be packaged");

            contents = readFile("packages/steal_build_test_multibuild_app_x-steal_build_test_multibuild_app_y.js");
            s.test.equals(/init_plugin_xy/.test(contents), true,
                    "content of plugin_xy.js should be packaged");

            contents = readFile("packages/steal_build_test_multibuild_app_y-steal_build_test_multibuild_app_z.js");
            s.test.equals(/init_plugin_yz/.test(contents), true,
                    "content of plugin_yz.js should be packaged");

            contents = readFile("steal/build/test/multibuild/app_x/production.js");
            s.test.equals(/init_app_x/.test(contents), true,
                    "content of app_x.js should be packaged");

            contents = readFile("steal/build/test/multibuild/app_y/production.js");
            s.test.equals(/init_app_y/.test(contents), true,
                    "content of app_y.js should be packaged");

            contents = readFile("steal/build/test/multibuild/app_z/production.js");
            s.test.equals(/init_app_z/.test(contents), true,
                    "content of app_z.js should be packaged");
            s.test.equals(/init_plugin_z/.test(contents), true,
                    "content of plugin_z.js should be packaged");
                    
                    
            contents = readFile("packages/steal_build_test_multibuild_app_x-steal_build_test_multibuild_app_y-steal_build_test_multibuild_app_z.css");
            s.test.equals(/#nested_plugin_xyz_styles/.test(contents), true,
                    "content of nested_plugin_xyz.css should be packaged");

            contents = readFile("packages/steal_build_test_multibuild_app_x-steal_build_test_multibuild_app_y.css");
            s.test.equals(/#plugin_xy_styles/.test(contents), true,
                    "content of plugin_xy.css should be packaged");

            contents = readFile("packages/steal_build_test_multibuild_app_y-steal_build_test_multibuild_app_z.css");
            s.test.equals(/#plugin_yz_styles/.test(contents), true,
                    "content of plugin_yz.css should be packaged");

            contents = readFile("steal/build/test/multibuild/app_x/production.css");
            s.test.equals(/#app_x_styles/.test(contents), true,
                    "content of app_x.css should be packaged");

            contents = readFile("steal/build/test/multibuild/app_y/production.css");
            s.test.equals(/#app_y_styles/.test(contents), true,
                    "content of app_y.css should be packaged");

            contents = readFile("steal/build/test/multibuild/app_z/production.css");
            s.test.equals(/#app_z_styles/.test(contents), true,
                    "content of app_z.css should be packaged");
            s.test.equals(/#plugin_z_styles/.test(contents), true,
                    "content of plugin_z.css should be packaged");
                    
            var linkTags;

            s.test.open("steal/build/test/multibuild/app_x/app_x.prod.html");
            linkTags = document.getElementsByTagName("link");
            s.test.equals(/packages\/steal_build_test_multibuild_app_x-steal_build_test_multibuild_app_y-steal_build_test_multibuild_app_z\.css/.test(linkTags[0].href), true,
                    "loaded direct dependencies stylesheet");
            s.test.equals(/packages\/steal_build_test_multibuild_app_x-steal_build_test_multibuild_app_y\.css/.test(linkTags[1].href), true,
                    "loaded indirect dependencies stylesheet");
            s.test.equals(/multibuild\/app_x\/production\.css/.test(linkTags[2].href), true,
                    "loaded app dependencies stylesheet");
            s.test.equals(linkTags.length, 3,
                    "3 stylesheets are loaded");
                    
            s.test.equals(modulesLoaded[0], "nested_plugin_xyz",
                    "nested_plugin_xyz should have loaded");
            s.test.equals(modulesLoaded[1], "plugin_xy",
                    "plugin_xy should have loaded");
            s.test.equals(modulesLoaded[2], "app_x",
                    "app_x should have loaded");
			s.test.clear();


            s.test.open("steal/build/test/multibuild/app_y/app_y.prod.html");
            linkTags = document.getElementsByTagName("link");
            s.test.equals(linkTags.length, 4,
                    "4 stylesheets are loaded");
            s.test.equals(modulesLoaded[0], "nested_plugin_xyz",
                    "nested_plugin_xyz should have loaded (just once, even though it's included twice')");
            s.test.equals(modulesLoaded[1], "plugin_yz",
                    "plugin_xy should have loaded");
            s.test.equals(modulesLoaded[2], "plugin_xy",
                    "plugin_yz should have loaded");
            s.test.equals(modulesLoaded[3], "app_y",
                    "app_y should have loaded");
			s.test.clear();

            s.test.open("steal/build/test/multibuild/app_z/app_z.prod.html");
            linkTags = document.getElementsByTagName("link");
            s.test.equals(linkTags.length, 3,
                    "3 stylesheets are loaded");
            s.test.equals(modulesLoaded[0], "nested_plugin_xyz",
                    "nested_plugin_xyz should have loaded");
            s.test.equals(modulesLoaded[1], "plugin_yz",
                    "plugin_yz should have loaded");
            s.test.equals(modulesLoaded[2], "plugin_z",
                    "plugin_z should have loaded");
            s.test.equals(modulesLoaded[3], "app_z",
                    "app_z should have loaded");
        });
    });
	
	// Closure doesn't handle these characters, and you should probably be pulling them in from elsewhere.
	// but I'd still like this to work.
	return;
	s.test.test("foreign characters", function(){
		s.test.remove('steal/build/test/production.js')
		load('steal/rhino/rhino.js')
		steal("steal/build","steal/build/scripts").then(function(s2){
			s2.build("steal/build/test/foreign.html", {
				to: 'steal/build/test'
			})
		})
		
		s.test.clear();
	
		//check that srcs are equal
		f1 = readFile('steal/build/test/foreign.js')
			.replace(/[\r\n;]/g,"");
		f2 = readFile('steal/build/test/production.js').replace(/steal\.\w+\([^\)]+\);/g,"")
			.replace(/[\r\n;]/g,"");
		s.test.equals(f1, f2, "Foreign Characters")
	
		s.test.clear();
		s.test.remove('steal/build/test/production.js')
	});
	

});