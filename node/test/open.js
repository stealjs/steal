var opener = require('../open.js');

opener('can', function(opener) {
	opener.each(function(stl) {
		console.log(stl.id.toString());
	});
});
