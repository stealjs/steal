steal.map({
	foo: 'steal/test/map/foo', 
	remotejquery: 'http://javascriptmvc.com/'//,
	//'thing/bed' : '/abc/bed'
});

steal.map('foo','steal/test/map/foo');

steal.plugins('foo',
	'foo/another',
	'jquery/view/ejs',
	'remotejquery/jquery/lang',
	//'thing/bed',
	//'thing/bed/couch',
	'foo/second')
	.then('remotejquery/jquery/lang/rsplit/rsplit')
	.then(function(){
		$(document.body).append('//foo/template', {})
	})
