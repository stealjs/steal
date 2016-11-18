
	System.setContextual("@node-require", function(name){
		if(isNode) {
			var nodeRequire = require;
			var load = {name: name, metadata: {}};
			return this.locate(load).then(function(address){
				var url = address.replace("file:", "");
				return {
					"default": function(specifier){
						var resolve = nodeRequire("resolve");
						var res = resolve.sync(specifier, {
							basedir: nodeRequire("path").dirname(url)
						});
						return nodeRequire(res);
					},
					__useDefault: true
				};
			});
		} else {
			return {
				"default": function(){},
				__useDefault: true
			}
		}
	});
