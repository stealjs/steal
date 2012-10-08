var fs = require('fs');
var Promise = require('node-promise/promise');
var readFile_promise = Promise.convertNodeAsyncFunction(fs.readFile);

fs.readFile('core/core.js', 'utf8', function(err, core){
	var promises = [];
	if(err){
		return console.log('An error occured while reading core/core.js file')
	}
	var matches = core.match(/\/\*#\s+(.*?)\s+#\*\//g);
	matches.forEach(function(file){
		promises.push(readFile_promise("core/" + file.slice(3, -3).trim()));
	})
	Promise.all(promises).then(function(results){
		for(var i = 0; i < results.length; i++){
			core = core.replace(matches[i], results[i]);
			console.log("-- Adding core/" + matches[i].slice(3, -3).trim() )
		}
		fs.writeFile("steal.js", core, function(err){
			if(err){
				return console.log('There was an error with writing steal.js file')
			}
			console.log('steal.js was successfully built.')
		})
	})
});