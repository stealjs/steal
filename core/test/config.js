module('Config')

test('steal.config should return default config object', function(){
	equal(steal.config().env, 'development');
})

test('steal.config.startFile', function(){
	steal.config.startFile('foo/bar.html')
	equal(steal.config().startFile, 'foo/bar.html');
	equal(steal.config().production, 'foo/production.js');
})

test('steal.config.map', function(){
	steal.config({
		map: {
			'*' : {
				jquery : 'foo/bar/jquery'
			}
		}
	})
	var resource = Module.make('jquery');
	equal(resource.options.id.path, 'foo/bar/jquery/jquery.js');
})

test('steal.getScriptOptions', function(){
	var script = h.scriptTag(), scriptOpts;
	script.src = "http://localhost/app/steal.production.js?foobarapp,development";
	scriptOpts = steal.getScriptOptions(script);
	equal(scriptOpts.env, "development");
	equal(scriptOpts.root, "http://localhost/app");
	equal(scriptOpts.startFile, "foobarapp/foobarapp.js");
	script.src = "http://localhost/app/steal.production.js?foobarapp";
	scriptOpts = steal.getScriptOptions(script);
	equal(scriptOpts.env, "production");
	equal(scriptOpts.root, "http://localhost/app");
	equal(scriptOpts.startFile, "foobarapp/foobarapp.js");
	script.src = "http://localhost/app/steal.production.js?foobarapp.js";
	scriptOpts = steal.getScriptOptions(script);
	equal(scriptOpts.env, "production");
	equal(scriptOpts.root, "http://localhost/app");
	equal(scriptOpts.startFile, "foobarapp.js");
})

asyncTest('steal.config.shim', 7, function(){
	steal.config({
		shim: {
			"mocks/foobar" : {
				init: function(){
					return "foobar"
				}
			},
			"mocks/global" : {
				exports: "gLobal"
			},
			"mocks/hasdeps" : {
				init : function(global, foobar){
					equal(global, 42, "Arguments passed to the shim's init functions are correct");
					equal(foobar, "foobar", "Arguments passed to the shim's init functions are correct");
					return this.hasDeps;
				},
				deps : ["mocks/global", "mocks/foobar"]
			},
			"mocks/arraydeps" : ["mocks/global", "mocks/foobar"]
		}
	})
	var resourceA = Module.make('mocks/foobar');
	resourceA.completed.then(function(){
		equal(resourceA.value, "foobar")
		start();
	})
	resourceA.execute();
	var resourceB = Module.make('mocks/global');
	resourceB.completed.then(function(){
		equal(resourceB.value, 42)
		start();
	})
	resourceB.execute();
	var resourceC = Module.make('mocks/hasdeps');
	resourceC.completed.then(function(){
		ok(resourceC.value)
		start();
	})
	resourceC.execute();
	var resourceD = Module.make('mocks/hasdeps');
	resourceD.completed.then(function(){
		equal(window.gLobal, 42, "Deps were loaded before resource")
		equal(window.foobar, "baz", "Deps were loaded before resource")
		start();
	})
	resourceD.execute();
})