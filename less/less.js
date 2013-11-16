steal({id: "./less_engine.js",ignore: true},function(){

    /**
     * @page steal.less steal.less
     * @parent stealjs
     * @plugin steal/less
     *
     * @signature `steal('path/to/filename.less')`
     *
     * @param {String} path the relative path from the current file to the coffee file.
     * You can pass multiple paths.
     * @return {steal} returns the steal function.
     *
     *
     * @body
     *
     * Lets you build and compile [http://lesscss.org/ Less ] css styles.
     * Less is an extension of CSS that adds variables, mixins, and quite a bit more.
     *
     * You can write css like:
     *
     *     @@brand_color: #4D926F;
     *     #header {
	    *       color: @@brand_color;
     *     }
     *     h2 {
	    *       color: @@brand_color;
     *     }
     *
     * ## Use
     *
     * First, create a less file like:
     *
     *     @@my_color red
     *
     *     body { color:  @@my_color; }
     *
     *
     * Save this in a file named `red.less`.
     *
     * Next, you have to add the less entry to the `stealconfig.js` file so it
     * looks like this:
     *
     *     steal.config({
	     *         ext: {
	     *             less: "steal/less/less.js"
	     *         }
	     *     });
     *
     * This will automatically load the Less parser when the Less file is
     * loaded. It's expected that all Less files end with `less`.
     *
     * You can steal the Less file like any other file:
     *
     *     steal('filename.less')
     *
     */

    var imports = "",
        lessString,
        bound = false,
        createImport,
        createStyle;

    createImport = function(path){
        return "@import \""+path+"\";\n";
    };

    createStyle = function(text){
        var tag = document.createElement('style');
        tag.setAttribute('type',"text/less");
        if ( tag.styleSheet ) { // IE
            tag.styleSheet.cssText = text;
        } else {
            (function( node ) {
                if ( tag.childNodes.length ) {
                    if ( tag.firstChild.nodeValue !== node.nodeValue ) {
                        tag.replaceChild(node, tag.firstChild);
                    }
                } else {
                    tag.appendChild(node);
                }
            })(document.createTextNode(text));
        }
        document.getElementsByTagName("head")[0].appendChild(tag);
    };

    steal.type("less css", function(options, success, error){
        var src = options.src+"",
            base = "" + window.location,
            url = src.match(/([^\?#]*)/)[1],
						path;

        if(steal.isRhino){
					url = Envjs.uri(url, base);
					lessString = createImport(url);

					less.env = 'production';
					options.text = lessString;
					success();

        } else if(steal.isBuilding) /* in Node */ {
					var baseDir = base.substr(0, base.lastIndexOf('/')+1);
					url = baseDir + url;

					lessString = createImport(url);
					less.env = 'production';
					options.text = lessString;
					success();
				} else {
					path = steal.config('root')+ "/"+options.id.path;

					//set up imports for use by the less compiler
					//these are injected in to a parent less style block
					//and evaluated using less.refresh() below
					imports += createImport(path);

					//make sure this only happens once.
					if(!bound){
						bound = true;
						steal.one("end", function(){
							createStyle(imports);
							less.env = "production";
							less.dumpLineNumbers = 'all';
							less.refresh();
						});
					}
					options.text = "";
					success();
				}

    });
});
