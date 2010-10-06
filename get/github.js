/*  This is a port to JavaScript of Rail's plugin functionality.  It uses the following
 * license:
 *  This is Free Software, copyright 2005 by Ryan Tomayko (rtomayko@gmail.com) 
     and is licensed MIT: (http://www.opensource.org/licenses/mit-license.php)
 */

steal(function( steal ) {

	steal.get.github = function( url, where, options, level ) {
		if ( url ) {
			this.init.apply(this, arguments);
		}
	};

	steal.get.github.prototype = new steal.get.getter();
	steal.extend(steal.get.github.prototype, {
		init: function( url, where, options, level ) {

			steal.get.getter.prototype.init.apply(this, arguments);
			this.orig_cwd = this.cwd;
			if ( this.ignore ) {
				this.ignore.push(".gitignore", "dist");
			} else {
				this.ignore = [".gitignore", "dist"];
			}
			var split = url.split("/");
			this.username = split[3];
			this.project = split[4];
			this.branch = options.tag || "master";
		},
		get_latest_commit: function() {
			// http://github.com/api/v2/json/commits/list/jupiterjs/steal/master
			var latestCommitUrl = "http://github.com/api/v2/json/commits/list/" + this.username + "/" + this.project + "/" + this.branch,
				commitsText = readUrl(latestCommitUrl);
				eval("var c = " + commitsText);
			var commitId = c.commits[0].tree;
			return commitId;
		},
		ls_top: function( link ) {
			var id = this.get_latest_commit(),
				browseUrl = "http://github.com/api/v2/json/tree/show/" + this.username + "/" + this.project + "/" + id,
				browseText = readUrl(browseUrl);
				eval("var tree = " + browseText);
			var urls = [],
				item;
			for ( var i = 0; i < tree.tree.length; i++ ) {
				item = tree.tree[i];
				if ( item.type == "blob" ) {
					urls.push(this.url + item.name);
				}
				else if ( item.type == "tree" ) {
					urls.push(this.url + item.name + '/');
				}
			}
			return urls;
		},
		//links are relative
		links: function( base_url, contents ) {
			var links = [],
				newLink, anchors = contents.match(/href\s*=\s*\"*[^\">]*/ig),
				ignore = this.ignore,
				self = this,
				base = self.url + self.cwd.replace(self.orig_cwd + "/", "");
			
			anchors.forEach(function( link ) {
				link = link.replace(/href="/i, "");
				newLink = base + (/\/$/.test(base) ? "" : "/") + link;
				links.push(newLink);
			});
			return links;
		},
		download: function( link ) {
			// get real download link
			// http://github.com/jupiterjs/funcunit/qunit/qunit.js  -->
			// http://github.com/jupiterjs/steal/raw/master/test/qunit/qunit.js
			var rawUrl = this.url + "raw/" + this.branch + "/" + link.replace(this.url, ""),
				bn = new steal.File(link).basename(),
				f = new steal.File(this.cwd).join(bn);

			for ( var i = 0; i < this.ignore.length; i++ ) {
				if ( f.match(this.ignore[i]) ) {
					print("   I " + f);
					return;
				}
			}

			var oldsrc = readFile(f),
				tmp = new steal.File("tmp");

			tmp.download_from(rawUrl, true);
			var newsrc = readFile("tmp");
			var p = "   ",
				pstar = "   ";
				if ( oldsrc ) {
					var trim = /\s+$/gm,
						jar = /\.jar$/.test(f);


						if ((!jar && oldsrc.replace(trim, '') == newsrc.replace(trim, '')) || (jar && oldsrc == newsrc)) {
							tmp.remove();
							return;
						}
						print(pstar + "U " + f);
					tmp.copyTo(f);
				} else {
					print(pstar + "A " + f);
					tmp.copyTo(f);
				}
				tmp.remove();
		},
		fetch_dir: function( url ) {
			this.level++;
			if ( this.level > 0 ) {
				this.push_d(new steal.File(url).basename());
			}
			if ( this.level === 0 ) {
				this.fetch(this.ls_top());
			} else {
				// change to the raw url
				// http://github.com/jupiterjs/javascriptmvc/
				// http://github.com/jupiterjs/javascriptmvc/tree/master/controller?raw=true
				var rawUrl = this.url + "tree/" + this.branch + "/" + url.replace(this.url, "") + "?raw=true",
					contents = readUrl(rawUrl);
					
					this.fetch(this.links(url, contents));
			}
			if ( this.level > 0 ) {
				this.pop_d();
			}
			this.level--;
		}
	});

});