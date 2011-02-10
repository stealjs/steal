steal.map({
	poo: 'steal/test/map/foo', 
	jquery: 'http://javascriptmvc.com/jquery'//,
	//'thing/bed' : '/abc/bed'
});

steal.map('foo','steal/test/map/foo');

steal.plugins('poo',
	'poo/another',
	'jquery',
	'jquery/lang',
	//'thing/bed',
	//'thing/bed/couch',
	'foo/second')