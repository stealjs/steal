var fs = require('fs');
var Promise = require('node-promise/promise');
var readFile_promise = Promise.convertNodeAsyncFunction(fs.readFile);

module.exports = function (grunt) {
	var codestyle = {
		options : {
			indentSize : 1,
			indentChar : "\t"
		}
	};

	grunt.registerTask("build", function() {
		var done = this.async();
		fs.readFile(grunt.config('build').file, 'utf8', function (err, core) {
			var promises = [];
			if (err) {
				return console.log('An error occured while reading core/core.js file')
			}

			var matches = core.match(/\/\*#\s+(.*?)\s+#\*\//g);
			matches.forEach(function (file) {
				promises.push(readFile_promise("core/" + file.slice(3, -3).trim()));
			});

			Promise.all(promises).then(function (results) {
				var out = grunt.config('build').out;
				for (var i = 0; i < results.length; i++) {
					core = core.replace(matches[i], results[i]);
					console.log("-- Adding core/" + matches[i].slice(3, -3).trim())
				}
				fs.writeFile(out, core, function (err) {
					if (err) {
						return console.log('There was an error with writing ' + out)
					}
					console.log(out + ' was successfully built.')
					done();
				})
			})
		});
	});

	grunt.registerTask("nodetest", function(){
		var done = this.async(),
			flags = Object.keys(this.flags);

		var testFiles = {
			basic: ["test/node/basic.js"],
			multiple: ["test/node/multiple.js"]
		};

		var allFiles = (function(){
			var items = flags.length ? flags : Object.keys(testFiles);
			var files = [];

			items.forEach(function(i){
				files = files.concat(testFiles[i]);
			});

			return files;
		})();


		var Mocha = require('mocha');
		//Add the interface
		Mocha.interfaces["qunit-mocha-ui"] = require("qunit-mocha-ui");
		//Tell mocha to use the interface.
		var mocha = new Mocha({ui:"qunit-mocha-ui", reporter:"spec"});
		//Add your test files
		allFiles.forEach(mocha.addFile.bind(mocha));
		//Run your tests
		mocha.run(function(failures){
			process.exit(failures);
		});
	});


	grunt.initConfig({
		pkg : '<json:package.json>',
		meta : {
			banner : '/*! <%= pkg.title || pkg.name %> - <%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		out : 'steal.js',
		build : {
			file : 'core/core.js',
			out : '<%= out %>'
		},
		testee: {
			/*options: {
				root : "..",
 			},*/
			files: "core/test/qunit.html",
		},
		uglify: {
			steal: {
				files: {
					'steal.production.js': ['steal.js']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('testee');

	grunt.registerTask('test', ['testee', 'nodetest']);
	grunt.registerTask('default', ['build', 'uglify']);
};
