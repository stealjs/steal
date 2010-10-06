steal("//steal/get/json", "//steal/rhino/prompt", function( steal ) {
	/**
	 * @parent stealjs
	 * Downloads and installs a plugin from a url.  Normally this is run from the steal/getjs script.
	 * 
	 * <p>The following copies the mustache-javascript repo to a local mustache folder.</p>
	 * 
	 * @codestart text
	 * js steal/getjs "ttp://github.com/tdreyno/mustache-javascriptmvc mustache
	 * @codeend
	 * <p>Get will:</p>
	 * <ul>
	 * 	<li>Download the files that comprise the plugin.</li>
	 *  <li>Prompt you to install dependencies found in its dependencies.json file.</li>
	 *  <li>Prompt you to run an install script.</li>
	 * </ul>
	 * <h2>Offical Plugins</h2>
	 * <p>JavaScriptMVC maintains a list of offical plugins compatible with JavaScriptMVC 3.0.
	 *   You can install these by simply typing there name.  This is the current list of
	 *   offical plugins:
	 * </p>
	 * <ul>
	 * 	<li><code>mustache</code> - mustache templates.</li>
	 *  <li><code>steal</code> - script loader, and more.</li>
	 *  <li><code>jquery</code> - jQuery 1.4.3 and the MVC components.</li>
	 *  <li><code>funcunit</code> - Functional testing platform.</li>
	 *  <li><code>phui</code> - UI widgets.</li>
	 *  <li><code>documentjs</code> - documentation engine.</li>
	 * </ul>
	 * <p>You can install these just by writing</p>
	 * @codestart text
	 * js steal/getjs funcunit
	 * @codeend
	 * <p>If you have something good, let us know on the forums and we can make your project official too!</p>
	 * <h2>The Get function</h2>
	 * get takes a url or official plugin name and installs it.
	 * @param {String} url the path to a svn or github repo or a name of a recognized plugin.
	 * @param {Object} options configure the download.  
	 * <table class='options'>
	 * 	  <tr>
	 * 	      <th>Name</th><th>Description</th>
	 * 	  </tr>
	 * 	  <tr><td>name</td>
	 * 	  		<td>The name of the folder to put the download in.</td></tr>
	 * 
	 * 	</table>
	 * 
	 */
	var get = (steal.get = function( url, options ) {
		options = steal.opts(options, {
			name: 1
		});
		var getter, name = options.name;

		if (!url.match(/^http/) ) {
			name = url;
			url = pluginList(name);
		}
		if (!url ) {
			print("There is no plugin named " + name);
			return;
		}
		getter = url.indexOf("github.com") !== -1 ? get.github : get.getter;
		if (!name ) {
			name = guessName(url);
		}
		//make the folder for this plugin
		new steal.File(name).mkdirs();

		installDependencies(url, name);



		//get contents
		var fetcher = new getter(url, name, options);
		fetcher.quiet = options.quiet || true;

		fetcher.fetch();

		print("\n  " + name + " plugin downloaded.");
		runInstallScript(name);

		}),
		/**
		 * @hide
		 * looks for a url elsewhere
		 * @param {Object} name
		 */
		pluginList = function( name ) {
			print("  Looking for plugin ...");

			var plugin_list_source =
				readUrl("http://github.com/jupiterjs/steal/raw/master/get/gets.json");
			var plugin_list;
			eval("plugin_list = " + plugin_list_source);
			if ( plugin_list[name] ) {
				return plugin_list[name];
			}
			plugin_list_source = readFile("gets.json");

			eval("plugin_list = " + plugin_list_source);
			return plugin_list[name];
		},
		//gets teh name from the url
		guessName = function( url ) {
			var name = new steal.File(url).basename();
			if ( name === 'trunk' || !name ) {
				name = new steal.File(new steal.File(url).dir()).basename();
			}
			return name;
		},
		installDependencies = function( url, name ) {
			print("  Checking dependencies ...");
			var depend_url = url + (url.lastIndexOf("/") === url.length - 1 ? "" : "/") + "dependencies.json",
				depend_text, dependencies;
			try {
				depend_text = readUrl(depend_url);
			} catch (e) {}

			if (!depend_text ) {
				print("  No dependancies");
				return;
			}

			try {
				dependencies = JSONparse(depend_text);
			} catch (e) {
				print("  No or mailformed dependencies");
				return;
			}


			for ( var plug_name in dependencies ) {
				if ( steal.prompt.yesno("Install dependancy " + plug_name + "? (yN):") ) {
					print("Installing " + plug_name + "...");
					steal.get(dependencies[plug_name], {
						name: plug_name
					});
				}
			}

			print("  Installed all dependencies for " + name);
		},
		runInstallScript = function( name ) {
			if ( readFile(name + "/install.js") ) {

				var res = steal.prompt.yesno("\n  " + name + " has an install script." + "\n    WARNING! Install scripts may be evil.  " + "\n    You can run it manually after reading the file by running:" + "\n      js " + name + "/install.js" + "\n\n  Would you like to run it now? (yN):");
				if ( res ) {
					print("  running ...");
					load(name + "/install.js");
				}
			}
		};


}, "//steal/get/getter", "//steal/get/github");