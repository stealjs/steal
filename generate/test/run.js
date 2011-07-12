load('steal/rhino/rhino.js')

steal('steal/test', "steal/generate")
	.then('steal/generate/system.js').then(function(){
	_S = steal.test;
	
	//turn off printing
	STEALPRINT = false;
	
	print("==========================  steal/generate =============================")
	
	print("-- generate basic foo app --");
	
	var	data = steal.extend({
		path: "foo", 
		application_name: "foo",
		current_path: steal.File.cwdURL(),
		path_to_steal: new steal.File("foo").pathToRoot()
	}, steal.system);
	steal.generate("steal/generate/templates/app","foo",data)
	
	steal.File("foo").removeDir();
	
	print("== complete ==\n")
})