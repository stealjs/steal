steal('steal/less', function(){
	// print('running')
	var exports = {};
	exports.basic = true;
	if(!exports.appFiles){
		exports.appFiles = [];
	}
	exports.appFiles.push("one");
	return exports;
});
