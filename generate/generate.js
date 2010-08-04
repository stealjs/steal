steal("//steal/generate/ejs", '//steal/generate/inflector', function(steal){
	var render = function(from, to, data){
		var text = readFile(from);
		
		var res = new steal.EJS({ text : text, name: from }).render(data)
		new steal.File(to).save(res);
	},
	
	/**
	 * Given data, renders all the templates it finds in a directory and puts the rendered results in 
	 * a folder.
	 * @param {String} path the folder to get templates from
	 * @param {String} where where to put the results of the rendered templates
	 * @param {Object} data data to render the templates with
	 */
	generate = steal.generate = function(path, where, data){
		//get all files in a folder
		var folder = new steal.File(path);
		
		//first make sure the folder exists
		new steal.File(where).mkdirs();
		
		folder.contents(function(name, type, current){
			var loc = (current? current+"/" : "")+name,
				convert = loc.replace(/\(([^\)]+)\)/g, function(replace, inside){
					return data[inside];
				})
			
			if(type == 'file'){
				//if it's ejs, draw it where it belongs
				if(/\.ejs$/.test(name)){
					var put = where + "/"+convert.replace(/\.ejs$/,"");
					print('      ' +put )
					render(path+"/"+loc, put, data);
					
				}else if(/\.link$/.test(name)){
					var copy = readFile(path+"/"+loc) 					
					//if points to a file, copy that one file; otherwise copy the folder
					steal.generate(copy, where + "/"+convert.replace(/\.link$/,""), data);
					
					
					
				}
			}else{
				
				//create file
				print('      '+where + "/"+convert)
				new steal.File(where + "/"+convert).mkdirs();
				
				//recurse in new folder
				new steal.File(path+"/"+(current? current+"/" : "")+name)
					.contents(arguments.callee,(current? current+"/" : "")+name)
			}
		})
	};
	steal.extend(generate,{
		regexps: {
	        colons : /::/,
	        words: /([A-Z]+)([A-Z][a-z])/g,
	        lowerUpper : /([a-z\d])([A-Z])/g,
	        dash : /([a-z\d])([A-Z])/g
    	},
		underscore: function(s){
	        var regs = this.regexps;
	        return s.replace(regs.colons, '/').
	                 replace(regs.words,'$1_$2').
	                 replace(regs.lowerUpper,'$1_$2').
	                 replace(regs.dash,'_').toLowerCase()
	    },
		//converts a name to a bunch of useful things
		convert: function(name){
		    var className = name.match(/[^\.]*$/)[0] //Customer
		    var appName = name.split(".")[0] //Customer
			return {
		        underscore : generate.underscore(className),
				path : generate.underscore(name).replace(/\./g,"/").replace(/\/[^\/]*$/,""),
		        name : name,
				fullName : name,
				className : className,
				plural: steal.Inflector.pluralize(generate.underscore(className)),
				appName: appName.toLowerCase()
			}
	    },
		render : render
	});
	
});




