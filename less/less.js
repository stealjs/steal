steal({path: "less_engine.js",ignore: true},function(){
	
	
	steal.less = function(){
		//if production, 
		if(steal.options.env == 'production'){
			if(steal.loadedProductionCSS){
				return steal;
			}else{
				steal.createLink( steal.options.production.replace(".js",".css")  );
				loadedProductionCSS = true;
				return steal;
			}
		}
		//@steal-remove-start
		var current, path;
		for(var i=0; i < arguments.length; i++){
			current = new steal.File(arguments[i]+".less").joinCurrent();
			path = steal.root.join(current)
			if(steal.browser.rhino){
				//rhino will just look for this
				steal.createLink(path, {
					type : "text/less"
				})
			}else{
				var src = steal.request(path);
				//get and insert stype
				new (less.Parser)({
	                optimization: less.optimization,
	                paths: [path.replace(/[\w\.-]+$/, '')]
	            }).parse(src, function (e, root) {
	                var styles = root.toCSS(),
						css  = document.createElement('style');
			        
					css.type = 'text/css';
					css.id = steal.cleanId(path)
			        
					document.getElementsByTagName('head')[0].appendChild(css);
				    
				    if (css.styleSheet) { // IE
			            css.styleSheet.cssText = styles;
				    } else {
				        (function (node) {
				            if (css.childNodes.length > 0) {
				                if (css.firstChild.nodeValue !== node.nodeValue) {
				                    css.replaceChild(node, css.firstChild);
				                }
				            } else {
				                css.appendChild(node);
				            }
				        })(document.createTextNode(styles));
				    }

	            });
			}
		}
		//@steal-remove-end
		return steal;
	}
	//@steal-remove-start
	steal.build.types['text/less'] =  function(script, loadScriptText){
		var text =  loadScriptText(script.href, script),
			styles;
		new (less.Parser)({
	                optimization: less.optimization,
	                paths: [script.href.replace(/[\w\.-]+$/, '')]
	            }).parse(text, function (e, root) {
					styles = root.toCSS();
				});
		return styles;
	}
	//@steal-remove-end
})

