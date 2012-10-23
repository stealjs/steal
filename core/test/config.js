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
	var module = Module.make('jquery');
	equal(module.options.id.path, 'foo/bar/jquery/jquery.js');
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
	var moduleA = Module.make('mocks/foobar');
	moduleA.completed.then(function(){
		equal(moduleA.value, "foobar")
		start();
	})
	moduleA.execute();
	var moduleB = Module.make('mocks/global');
	moduleB.completed.then(function(){
		equal(moduleB.value, 42)
		start();
	})
	moduleB.execute();
	var moduleC = Module.make('mocks/hasdeps');
	moduleC.completed.then(function(){
		ok(moduleC.value)
		start();
	})
	moduleC.execute();
	var moduleD = Module.make('mocks/hasdeps');
	moduleD.completed.then(function(){
		equal(window.gLobal, 42, "Deps were loaded before module")
		equal(window.foobar, "baz", "Deps were loaded before module")
		start();
	})
	moduleD.execute();
})