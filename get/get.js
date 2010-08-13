

steal("//steal/get/json","//steal/rhino/prompt",function(steal){
/**
 * @parent stealtools
 * Downloads and installs a plugin from a url.
 * 
 * 
 * 
 * @param {String} url the path to a svn or github repo.
 * @param {Object} options configure the download
 * 
 */
var get = (steal.get =  function(url, options){
	options = steal.opts(options,{name: 1});
	var getter,
		name = options.name
	
	if(! url.match(/^http/)){
		name = url;
		url = pluginList(name);
	}
	if(!url){
		print("There is no plugin named "+name);
		return;
	}
	getter = url.indexOf("github.com") != -1 ? get.github : get.getter;
	if(!name){
		name = guessName(url);
	}

	installDependencies(url, name);

	//make the folder for this plugin
	new steal.File(name).mkdir();
	
	//get contents
	var fetcher = new getter(url, name, options);
	fetcher.quiet = options.quiet || true

	fetcher.fetch();
	
	print("\n  "+name+" plugin downloaded.");	
	runInstallScript(name);
	
}),
/**
 * @hide
 * looks for a url elsewhere
 * @param {Object} name
 */
pluginList  = function(name){
	print("  Looking for plugin ...")
		
	var plugin_list_source = 
		readUrl("http://github.com/pinhook/steal/raw/master/get/gets.json");
	var plugin_list;
	eval("plugin_list = "+plugin_list_source);
	if(plugin_list[name]) {
		return plugin_list[name]
	}
	var plugin_list_source = 
		readFile("gets.json");

	eval("plugin_list = "+plugin_list_source);
	return plugin_list[name]
},
//gets teh name from the url
guessName= function(url){
	var name = new steal.File(url).basename();
	if(name == 'trunk' || ! name){
		name = new steal.File( new steal.File(url).dir() ).basename();
	}
	return name;
},
installDependencies= function(url, name){
	print("  Checking dependencies ...");
	var depend_url = url + (url.lastIndexOf("/") == url.length - 1 ? "" : "/" )+"dependencies.json",
		depend_text,
		dependencies;
	try{
	   depend_text = readUrl(depend_url);
	}catch(e){};
	
	if(!depend_text ) {
		print("  No dependancies");
		return;
	}

	try{
		dependencies = JSONparse( depend_text );
	}catch(e){
		print("  No or mailformed dependencies");
		return;
	}
	
	
	for(var plug_name in dependencies){
		if(steal.prompt.yesno("Install dependancy "+plug_name+"? (yN):")){
			print("Installing "+plug_name+"...");
			steal.get(dependencies[plug_name], {name: plug_name});
		}
	}
	
	print("  Installed all dependencies for "+name)
},
runInstallScript = function(name){
	if(readFile(name+"/install.js")){
		   
		var res = steal.prompt.yesno("\n  "+name+" has an install script."+
			  "\n    WARNING! Install scripts may be evil.  "+
			  "\n    You can run it manually after reading the file by running:"+
			  "\n      js "+name+"/install.js"+
			  "\n\n  Would you like to run it now? (yN):")
		if(res){
			print("  running ...")
			load(name+"/install.js")
		}
	}
}


},
"//steal/get/getter",
"//steal/get/github")