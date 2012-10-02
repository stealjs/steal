module('Resource')

test('Resource.make always returns same resource for the same id', function(){
	var res = Resource.make('jquery');
	equal(res, Resource.make('jquery'))
})

test('loaded, run and completed are deferreds', function(){
	var res = Resource.make('jquery')
	var isArray = function (o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	}
	var isDeferred = function(obj){
		return isArray(obj.doneFuncs && obj.failFuncs);
	}
	ok(isDeferred(res.loaded))
	ok(isDeferred(res.run))
	ok(isDeferred(res.completed))
})

test('resource optins will be extended if called twice for the same id', function(){
	var res = Resource.make('jquery')
	var res2 = Resource.make({id: 'jquery', foo: 'bar'})
	equal(res.options.foo, 'bar')
})

test('callback functions for deferreds should be called', 2, function(){
	var res = Resource.make('jquery')
	var callbacks = ['completed', 'loaded'];
	for(var i = 0; i < callbacks.length; i++){
		res[callbacks[i]].then(function(){
			ok(true)
		})
	}
	res.complete();
	res.load();
})