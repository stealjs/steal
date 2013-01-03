steal("steal","steal/generate/ejs.js", 'steal/generate/inflector.js', 
	'steal/parse', 'steal/rhino/prompt.js', function(s, EJS, Inflector, parse ) {

	var render = function( from, to, data ) {
		var text = readFile(from);

		var res = new EJS({
			text: text,
			name: from
		}).render(data);
		var file = steal.File(to);
		//check if we are overwriting
		if ( data.force || !file.exists() || readFile(to) == res || steal.prompt.yesno("Overwrite " + to + "? [Yn]") ) {
			steal.File(to).save(res);
			return true;
		} else {
			return false;
		}

	},
		inserter = function(str){

			var insertions = [];

			return {
				insert: function(index, content){
					insertions.push({index: index, content:content});
					return this;
				},
				toString: function(){
					var insert = insertions.slice(0).sort( function(first, second){
						return second.index - first.index;
					});
					var start = str;
					insert.forEach(function(insert){
						//console.log(insert.content, insert.index);
						start = start.substr(0,insert.index)+insert.content+start.substr(insert.index);
					});
					return start;
				}
			};
		},
		/**
		 * @plugin steal/generate
		 * @parent stealjs
		 * 
		 * The Generate plugin makes building code generators crazy easy.
		 * StealJS comes with its own app generator.  JavaScriptMVC has more complex generators.
		 * 
		 * ## Steal Generators
		 * 
		 * ### app
		 * 
		 * Creates an application structure, build and clean scripts.
		 * 
		 * @codestart text
		 * js steal/generate/app <i>path/to/app</i> [OPTIONS]
		 * @codeend
		 * 
		 *   - path/to/app - The lowercase path you want your application in. 
		 * 
		 * ## JavaScriptMVC Generators
		 * 
		 * ### app
		 * 
		 * Creates a JavaScriptMVC application structure.
		 * 
		 * @codestart text
		 * js jquery/generate/app <i>path/to/app</i> [OPTIONS]
		 * @codeend
		 * 
		 *   - path/to/app - The lowercase path you want your application 
		 *     in. Keep application names short because they 
		 *     are used as namespaces.  The last part of the path 
		 *     will be taken to be your application's name.
		 * 
		 * ### controller
		 * 
		 * Creates a [jQuery.Controller $.Controller] and test files.
		 * 
		 * @codestart text
		 * js jquery/generate/controller <i>App.Videos</i> [OPTIONS]
		 * @codeend
		 * 
		 *   - App.Videos - The namespaced name of your controller.  For 
		 *     example, if your controller is 
		 *     named <code>Cookbook.Recipes</code>, the generator will 
		 *     create  <code>cookbook/recipes.js</code>. 
		 * 
		 * ### model
		 * 
		 * Creates a [jQuery.Model] and test files.
		 * 
		 * @codestart text
		 * js jquery/generate/model <i>App.Models.Name</i> [TYPE] [OPTIONS]
		 * @codeend
		 * 
		 *   - App.Models.Name - The namespaced name of your 
		 *     model. For example, if your model is 
		 *     named <code>Cookbook.Models.Recipe</code>, the 
		 *     generator will 
		 *     create <code>cookbook/models/recipe.js</code>. 
		 * 
		 * ### page
		 * 
		 * Creates a page that loads steal.js and an application.
		 * 
		 * @codestart text
		 * js jquery/generate/model <i>path/to/app</i> <i>path/to/page.html</i>
		 * @codeend
		 * 
		 *   - path/to/app - The path to your apps folder. 
		 *   - path/to/page.html - The path to the page you want to create. 
		 * 
		 * ### plugin
		 * 
		 * Use plugin to create a file and 
		 * folder structure for basic jQuery plugins.
		 * 
		 * @codestart text
		 * js jquery/generate/plugin <i>path/to/plugin</i> [OPTIONS]
		 * @codeend
		 * 
		 *   - path/to/plugin - The path to where you want 
		 *   your plugin. 
		 *   
		 * 
		 * ### scaffold
		 * 
		 * Creates the controllers, models, and fixtures used
		 * to provide basic CRUD functionality..
		 * 
		 * @codestart text
		 * js jquery/generate/scaffold <i>App.Models.ModelName</i> [OPTIONS]
		 * @codeend
		 * 
		 *   - App.Models.ModelName - The model resource you want to add CRUD functionality to.
		 * 
		 * 
		 * <h2>The Generator Function</h2>
		 * <p>Renders a folders contents with EJS and data and then copies it to another folder.</p>
		 * @codestart
		 * steal.generate(
		 *   "path/to/my_template_folder",
		 *   "render/templates/here", 
		 *   {
		 *     data: "to be used"
		 *   })
		 * @codeend
		 * @param {String} path the folder to get templates from
		 * @param {String} where where to put the results of the rendered templates
		 * @param {Object} data data to render the templates with.  If force is true, it will overwrite everything
		 */
		generate = (steal.generate = function( path, where, data ) {
			//get all files in a folder
			var folder = new steal.File(path);

			//first make sure the folder exists
			new steal.File(where).mkdirs();

			folder.contents(function( name, type, current ) {
				var loc = (current ? current + "/" : "") + name,
					convert = loc.replace(/\(([^\)]+)\)/g, function( replace, inside ) {
						return data[inside];
					});

					if ( type === 'file' ) {
						//if it's ejs, draw it where it belongs
						if (/\.ignore/.test(name) ) {
							//do nothing
						} else if (/\.ejs$/.test(name) ) {
							var put = where + "/" + convert.replace(/\.ejs$/, "");



							if ( render(path + "/" + loc, put, data) ) {
								steal.print('      ' + put);
							}

						} else if (/\.link$/.test(name) ) {
							var copy = readFile(path + "/" + loc);
							//if points to a file, copy that one file; otherwise copy the folder
							steal.generate(copy, where + "/" + convert.replace(/\.link$/, ""), data);

						}
					} else if(!/^\.\w+$/.test(name)){

						//create file
						//steal.print('      ' + where + "/" + convert);
						new steal.File(where + "/" + convert).mkdirs();

						//recurse in new folder
						new steal.File(path + "/" + (current ? current + "/" : "") + name).contents(arguments.callee, (current ? current + "/" : "") + name);
					}
			});
		});
	steal.extend(generate, {
		regexps: {
			colons: /::/,
			words: /([A-Z]+)([A-Z][a-z])/g,
			lowerUpper: /([a-z\d])([A-Z])/g,
			dash: /([a-z\d])([A-Z])/g,
			undHash: /_|-/
		},
		underscore: function( s ) {
			var regs = this.regexps;
			return s.replace(regs.colons, '/')
				.replace(regs.words, '$1_$2')
				.replace(regs.lowerUpper, '$1_$2')
				.replace(regs.dash, '_').toLowerCase();
		},
		//converts a name to a bunch of useful things
		
		/**
		 * Takes a module name and returns a bunch of useful properties of 
		 * that module.
		 * "my_app/foo/zed_ted" ->
		 * {
		 *   appName : "foobar",
		 *   className : "ZedTed",
		 *   fullName : "FooBar.ZedTed",
		 *   name : "FooBar.ZedTed",
		 *   path : foo_bar,
		 *   underscore : "zed_ted"
		 * }
		 */
		convert: function( moduleId ) {
			var path = s.id(moduleId)+"";
			var parts = moduleId.split("/"),
				last = parts[parts.length-1],
				appPath = parts.slice(0,parts.length -1).join("/"),
				appName = parts[parts.length - 2];
			
			// try to find likely app ...
			if( /models|controls/.test(parts[parts.length-2]||"") ){
				appPath = parts.slice(0,parts.length -2).join("/"),
				appName = parts[parts.length - 3];
			}
			
			return {
				module: moduleId,
				parentModule: moduleId.replace(/\/\w+$/, ""),
				_alias: last,
				underscore: last,
				alias: this.camelize(last),
				pluralAlias: Inflector.pluralize(this.camelize(last)),
				plural: Inflector.pluralize(this.camelize(last)),
				Plural: Inflector.pluralize(this.classize(last)),
				Alias: this.classize(last),
				path: path,
				appName: appName,
				appPath: appPath
			};
		},
		/**
		 *     generate.camelize("foo_bar") //-> "fooBar"
		 */
		camelize: function(str){ 
			return str.replace(/[-_]+(.)?/g, function(match, chr){ 
				return chr ? chr.toUpperCase() : '' 
			}) 
		},
		/**
		 *    generate.camelize("foo_bar") //-> "FooBar"
		 */
		classize: function(str){
			return this.capitalize( this.camelize(str) );
		},
		/**
		 *    generate.capitalize("foo_bar") //-> "Foo_bar"
		 */
		capitalize: function(str){
			return str.charAt(0).toUpperCase()+str.substr(1)
		},
		downcase: function(str){
			return str.charAt(0).toLowerCase()+str.substr(1)
		},
		insertCode: function( destination, newCode ){
			// get file, parse it
			var fileTxt = readFile(destination),
				parser =  parse(fileTxt),
				tokens = [],
				lastToken,
				token;

			// parse until function(
			while (tokens = parser.until(["function", "("])) {
				if (tokens) {
					parser.partner("{", function(token){
						if (token.value == "}") {
							lastToken = token;
						}
						// print("TOKEN = " + token.value, token.type, token.from, token.to)
					});
				}
			}
			
			
			// insert steal
			if(lastToken){
				fileTxt = fileTxt.slice(0, lastToken.from) 
					+ newCode + "\n" + fileTxt.slice(lastToken.from);
				steal.File(destination).save(fileTxt);
				steal.print('      ' + destination + ' (code added)');
			} else {
				steal.print('      ' + destination + ' (error adding)');
			}
			
			
			// save back to original file destination
			
		},
		/**
		 *     insertSteal(""
		 */
		_insertSteal: function(source, moduleId, options){
			var parser =  parse(source),
				firstToken,
				firstVariable,
				token,
				newline = options && options.newline,
				cur;

			var variableName = (options && options.name),
				moduleIdTokens = [],
				endArgToken,
				argumentNameTokens = [];

			// parse until steal(
			if (token = parser.until(["steal", "("])) {
				// start finding moduleIdTokens
				firstToken = cur = parser.moveNext();
				do {
					if (cur.type === "string") {
						// save moduleIdToken
						moduleIdTokens.push(cur);
						if ( cur.value === moduleId ) { // duplicate
							throw "DUPLICATE " + moduleId;
						}
					}
					
				} while( ( cur = parser.moveNext() ) && ( cur.value === "," || cur.type === "string" ) );
			}
			endArgToken = cur;
			if(cur && cur.value === 'function') {
				endArgToken = parser.moveNext();
				// We need to add after opening `(`
				while( ( cur = parser.moveNext() ) && (cur.value !== ")" )){
					if(cur.type == "name"){
						argumentNameTokens.push(cur)
					}
				}
				
			}
			var sourceModifier = inserter(source),
				functionExists = endArgToken && endArgToken.value === '(';
			// try to find place where we add everything
			
			if(!firstToken){
				if(variableName){
					return "steal('" + moduleId +"', function(" + variableName + "){});"
				} else {
					return "steal('" + moduleId +"');"
				}
			} else {
				// steal is present
				if ( !variableName ){ 
					// always add to the end
					if( moduleIdTokens.length ) {
						sourceModifier.insert(moduleIdTokens[moduleIdTokens.length -1].to,",\n\t'"+moduleId+"'");
					} else {
						if(functionExists) {
							sourceModifier.insert( firstToken.from, "'"+moduleId+"',\n\t");
						} else {
							sourceModifier.insert( firstToken.from, "'"+moduleId+"'");
						}
						
						
					}
				} else {
					// adding a module and a variable
					if( argumentNameTokens.length ) {
						// try to add after latest argument
						var place = argumentNameTokens.length - 1;
						sourceModifier.insert(argumentNameTokens[place].to,", "+variableName);
						sourceModifier.insert(moduleIdTokens[place].to,",\n\t'"+moduleId+"'");
						
					} else {
						// no existing arguments
						var hasModules = moduleIdTokens.length;
						// add to start
						if(functionExists){
							//print("  "+functionExists+" "+)
							// there is a function, it's just empty
							sourceModifier.insert(endArgToken.to,variableName);
							sourceModifier.insert( firstToken.from, "'"+moduleId+"',\n\t")
							
						} else {
							// there is no function
							if( hasModules ){
								// but there are modules
								sourceModifier.insert(endArgToken.from,",\n\tfunction(" + variableName + "){}");
								sourceModifier.insert( firstToken.from, "'"+moduleId+"',\n\t");
							} else {
								// empty steal
								sourceModifier.insert( firstToken.from, "'"+moduleId+"',\n\tfunction(" + variableName + "){}")
							}
						}
					}
				}
				
				return sourceModifier.toString();
			}
		},
		/**
		 * Inserts a new steal, like "foo/bar" into a file.  It can handle 4 cases:
		 * 
		 *   1. Page already looks like steal("a", function(){})
		 *   1. Page already looks like steal(function(){})
		 *   1. Page has no steals
		 *   1. Page already looks like steal("a")
		 *   
		 *   It will try to put the new steal before the last function first
		 *   
		 * @param {String} destination a path to the script we're inserting a steal into
		 * @param {String} newStealPath the new steal path to be inserted
		 */
		insertSteal: function( destination, newStealPath, options ){
			
			// get file, parse it
			var fileTxt = readFile(destination);
			fileTxt = this._insertSteal( fileTxt, newStealPath, options );

			steal.print('      ' + destination + ' (steal added)');
			// save back to original file destination
			steal.File(destination).save(fileTxt);
		},
		render: render
	});

	steal.Inflector = Inflector;
	steal.EJS = EJS;
	return steal;
});