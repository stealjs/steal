
var openForSteal = function(app, cb){
	
	steal.build.open('steal/rhino/blank.html', {
			startFile: startFile
	}, function(opener){
		cb( opener.firstSteal )
	});
	
}

steal.build.open('steal/rhino/blank.html', {
						startFile: startFile
				}, function(opener){
					
					appFiles.push(  addDependencies(opener.firstSteal.dependencies[1], files, app )  );
					apps[app] = [];

					callNext();
				})