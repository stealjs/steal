"use strict";
module.exports = function (grunt) {

	var core = ["<%= pkg.name %>.js", "<%= pkg.name %>.production.js", "ext/**"];

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		meta: {
			banner: "/*\n *  <%= pkg.name %> v<%= pkg.version %>\n" +
			"<%= pkg.homepage ? ' *  ' + pkg.homepage + '\\n' : '' %>" +
			" *  \n" +
			" *  Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
			" Licensed <%= _.map(pkg.licenses, 'type').join(', ') %>\n */"
		},
		esnext: {
			dist: {
				src: [
					"src/loader/lib/loader.js",
					"src/loader/lib/transpiler.js",
					"src/loader/lib/system.js"
				],
				dest: "src/loader/loader-esnext.js"
			}
		},
		"string-replace": {
			dist: {
				files: {
					"src/loader/loader-esnext.js": "src/loader/loader-esnext.js"
				},
				options: {
					replacements:[{
						pattern: "var $__Object$getPrototypeOf = Object.getPrototypeOf;\n" +
							"var $__Object$defineProperty = Object.defineProperty;\n" +
							"var $__Object$create = Object.create;",
						replacement: ""
					}, {
						pattern: "$__Object$getPrototypeOf(SystemLoader.prototype).constructor",
						replacement: "$__super"
					}]
				}
			}
		},
		concat: {
			loader: {
				src: [
					"node_modules/when/es6-shim/Promise.js",
					"src/loader/lib/polyfill-wrapper-start.js",
					"src/loader/loader-esnext.js",
					"src/loader/lib/polyfill-wrapper-end.js"
				],
				dest: "src/loader/loader.js"
			},
			"loader-no-promises": {	// use native promises instead of shim
				src: [
					"src/loader/lib/polyfill-wrapper-start.js",
					"src/loader/loader-esnext.js",
					"src/loader/lib/polyfill-wrapper-end.js"
				],
				dest: "src/loader/loader-sans-promises.js"
			},
			base: {
				src: [
					"src/base/lib/banner.js",
					"src/base/lib/polyfill-wrapper-start.js",
					"src/base/lib/util.js",
					"src/base/lib/extension-core.js",
					"src/base/lib/extension-meta.js",
					"src/base/lib/extension-register.js",
					"src/base/lib/extension-es6.js",
					"src/base/lib/extension-global.js",
					"src/base/lib/extension-cjs.js",
					"src/base/lib/extension-amd.js",
					"src/base/lib/extension-map.js",
					"src/base/lib/extension-plugins.js",
					"src/base/lib/extension-bundles.js",
					"src/base/lib/extension-depCache.js",
					"src/base/lib/register-extensions.js",
					"src/base/lib/polyfill-wrapper-end.js"
				],
				dest: "src/base/base.js"
			},
			dist: {
				src: [
					"src/loader/loader.js",
					"src/base/base.js",
					"src/start.js",
					"src/normalize.js",
					"src/core.js",		// starts makeSteal
					"src/system-extension-ext.js",
					"src/system-extension-forward-slash.js",
					"src/system-extension-locate.js",
					"src/system-extension-contextual.js",
					"src/system-extension-script-module.js",
					"src/system-extension-steal.js",
					"src/system-extension-module-loaded-twice.js",
					"src/trace/trace.js",
					"src/json/json.js",
					"src/cache-bust/cache-bust.js",
					"src/config.js",
					"src/env/env.js",
					"src/startup.js",
					"src/import.js",
					"src/make-steal-end.js", // ends makeSteal
					"src/end.js"
				],
				dest: "<%= pkg.name %>.js"
			},
			"dist-no-promises": {
				src: [
					"src/loader/loader-sans-promises.js",
					"src/base/base.js",
					"src/start.js",
					"src/normalize.js",
					"src/core.js",		// starts makeSteal
					"src/system-extension-ext.js",
					"src/system-extension-forward-slash.js",
					"src/system-extension-locate.js",
					"src/system-extension-contextual.js",
					"src/system-extension-script-module.js",
					"src/system-extension-steal.js",
					"src/system-extension-module-loaded-twice.js",
					"src/trace/trace.js",
					"src/json/json.js",
					"src/cache-bust/cache-bust.js",
					"src/config.js",
					"src/env/env.js",
					"src/startup.js",
					"src/import.js",
					"src/make-steal-end.js", // ends makeSteal
					"src/end.js"
				],
				dest: "<%= pkg.name %>-sans-promises.js"
			},
			nodeMain: {
				src: [
					"src/start.js",
					"src/normalize.js",
					"src/core.js",		// starts makeSteal
					"src/system-extension-ext.js",
					"src/system-extension-forward-slash.js",
					"src/system-extension-locate.js",
					"src/system-extension-contextual.js",
					"src/system-extension-script-module.js",
					"src/system-extension-steal.js",
					"src/trace/trace.js",
					"src/json/json.js",
					"src/cache-bust/cache-bust.js",
					"src/config.js",
					"src/env/env.js",
					"src/startup.js",
					"src/node-require.js",
					"src/import.js",
					"src/make-steal-end.js", // ends makeSteal
					"src/base/base.js",
					"src/end.js"
				],
				dest: "main.js"
			}
		},
		uglify: {
			options: {
				banner: "<%= meta.banner %>\n",
				compress: {
					drop_console: true
				}
			},
			dist: {
				src: "<%= pkg.name %>.js",
				dest: "<%= pkg.name %>.production.js"
			},
			"dist-no-promises": {
				src: "<%= pkg.name %>-sans-promises.js",
				dest: "<%= pkg.name %>-sans-promises.production.js"
			}
		},
		copy: {
			// copy plugins that steal should contain
			extensions: {
				files: [
					{src: ["node_modules/traceur/bin/traceur.js"], dest: "ext/traceur.js", filter: "isFile"},
					{src: ["node_modules/traceur/bin/traceur-runtime.js"], dest: "ext/traceur-runtime.js", filter: "isFile"},
					{src: ["node_modules/babel-standalone/babel.js"], dest: "ext/babel.js", filter: "isFile"}
				]
			},
			toTest: {
				files: [
					{expand: true, src: core, dest: "test/", filter: "isFile"},
					{expand: true, src: core, dest: "test/steal/", filter: "isFile"},
					{expand: true, src: core, dest: "test/bower_components/steal/", filter: "isFile"},
					{expand: true, src: core, dest: "test/npm/node_modules/steal/", filter: "isFile"},
					{expand: true, src: core, dest: "test/npm-deep/node_modules/steal/", filter: "isFile"},
					{expand: true, src: core, dest: "test/npm/bower/node_modules/steal/", filter: "isFile"},
					{expand: true, src: core, dest: "test/bower/bower_components/steal/", filter: "isFile"},
					{expand: true, src: core, dest: "test/bower/npm/bower_components/steal/", filter: "isFile"},
					{expand: true, src: ["node_modules/jquery/**"], dest: "test/npm/", filter: "isFile"}
				]
			},

		},
		watch: {
			files: ["src/*.js"],
			tasks: "default"
		},
		jshint: {
			options: {
				jshintrc: ".jshintrc"
			},
			lib: ["src/**/*.js"]
		},
		testee: {
			tests: {
				options: {
					browsers: ["firefox"]
				},
				src: require("./test/test-pages-urls").map(function(o) {
					return o.url;
				})
			}
		},
		simplemocha: {
			builders: {
				src: [
					"test/node_test.js",
					"test/steal_import/test.js"
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-simple-mocha");
	grunt.loadNpmTasks("grunt-esnext");
	grunt.loadNpmTasks("testee");

	grunt.registerTask("test", ["build", "testee:tests", "simplemocha"]);
	grunt.registerTask("loader", ["esnext", "string-replace"]);
	grunt.registerTask("copy-to", ["copy:extensions", "copy:toTest"]);
	grunt.registerTask("build", ["loader", "concat", "uglify:dist", "copy-to"]);
	grunt.registerTask("build-no-promises", ["loader", "concat", "uglify:dist-no-promises", "copy-to"]);

	grunt.registerTask("default", ["build", "build-no-promises"]);
};
