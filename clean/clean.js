// lets you know if your JS sucks and will try to clean it for you

steal.plugins('steal/build').then('//steal/clean/beautify','//steal/rhino/prompt', function(steal){
	/**
	 * @parent stealtools
	 * Beautifies source code [http://jsbeautifier.org/ JS Beautify].
	 * @codestart text
	 * ./js steal/cleanjs myapp/myapp.html
	 * @codeend
	 * @param {String} url the path to a page or a JS file
	 * @param {Object} options
	 */
	steal.clean = function(url, options){
		options = steal.extend(
			{indent_size: 1, 
			 indent_char: '\t', 
			 space_statement_expression: true,
			 jquery : false},
			steal.opts(options || {}, {
				//compress everything, regardless of what you find
				all : 1,
				//folder to build to, defaults to the folder the page is in
				to: 1,
				print : 1
			}) )
		
		//if it ends with js, just rewwrite
		
		if(/\.js/.test(url)){
			var text = readFile(url);
			print('Beautifying '+url)
			var out = js_beautify(text, options);
			if(options.print){
				print(out)
			}else{
				steal.File(url).save( out  )
			}
			
		}else{
			var folder = steal.File(url).dir(),
				clean = /\/\/@steal-clean/
			//folder
			
			steal.build.open(url).each(function(script, text, i){
				if(!text || !script.src){
					return;
				}
				var path = steal.File(script.src).joinFrom(folder).replace(/\?.*/,"")
				if(clean.test(text) || (!options.jquery && path == "jquery/jquery.js")){
					print("I "+path)
				}else{
					var out = js_beautify(text, options);
					if(out == text){
						print("C "+path)
					}else{
						if(steal.prompt.yesno("B "+path+" Overwrite? [Yn]")){
							if(options.print){
								print(out)
							}else{
								steal.File(path).save( out  )
							}
						}
	
					}
					
				}
			});
		}
		
		
		
		
	};
	

  
});