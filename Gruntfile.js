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
		" Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %>\n */"
	},
	release: {},
	concat: {
	  dist: {
		src: [
			"node_modules/steal-es6-module-loader/dist/es6-module-loader.src.js",
			"node_modules/steal-systemjs/dist/system.src.js",
			"src/start.js",
			"src/normalize.js",
			"src/core.js",		// starts makeSteal
			"src/system-extension-ext.js",
			"src/system-extension-forward-slash.js",
			"src/system-extension-locate.js",
			"src/system-extension-contextual.js",
			"src/system-extension-script-module.js",
			"node_modules/system-trace/trace.js",
			"src/json/json.js",
			"src/config.js",
			"node_modules/steal-env/env.js",
			"src/startup.js",
			"src/import.js",
			"src/make-steal-end.js", // ends makeSteal
			"src/system-format-steal.js",
			"src/end.js"
		],
		dest: "<%= pkg.name %>.js"
	  },
	  systemFormat: {
		src: [
		  "src/system-format-start.js",
		  "src/normalize.js",
		  "src/system-format-steal.js",
		  "src/system-format-end.js"
		],
		dest: "system-format-steal.js"
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
		  "node_modules/system-trace/trace.js",
		  "src/json/json.js",
		  "src/config.js",
		  "node_modules/steal-env/env.js",
		  "src/startup.js",
		  "src/import.js",
		  "src/make-steal-end.js", // ends makeSteal
		  "src/system-format-steal.js",
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
		options: {
		  banner: "<%= meta.banner %>\n"
		},
		src: "<%= pkg.name %>.js",
		dest: "<%= pkg.name %>.production.js"
	  }
	},
	copy: {
		// copy plugins that steal should contain
	  extensions: {
		files: [
		  {src:["node_modules/steal-css/css.js"], dest: "ext/css.js", filter: "isFile"},
		  {src:["node_modules/steal-npm/npm.js"], dest: "ext/npm.js", filter: "isFile"},
		  {src:["node_modules/steal-less/less.js"], dest: "ext/less.js", filter: "isFile"},
		  {src:["node_modules/steal-less/node_modules/less/dist/less.js"], dest: "ext/less-engine.js", filter: "isFile"},
		  {src:["node_modules/steal-npm/npm-extension.js"], dest: "ext/npm-extension.js", filter: "isFile"},
		  {src:["node_modules/steal-npm/npm-utils.js"], dest: "ext/npm-utils.js", filter: "isFile"},
		  {src:["node_modules/steal-npm/npm-crawl.js"], dest: "ext/npm-crawl.js", filter: "isFile"},
          {src:["node_modules/steal-npm/npm-convert.js"], dest: "ext/npm-convert.js", filter: "isFile"},
          {src:["node_modules/steal-npm/npm-load.js"], dest: "ext/npm-load.js", filter: "isFile"},
		  {src:["node_modules/steal-npm/semver.js"], dest: "ext/semver.js", filter: "isFile"},
		  {src:["node_modules/system-live-reload/live.js"], dest: "ext/live-reload.js", filter: "isFile"},
		  {src:["node_modules/traceur/bin/traceur.js"], dest: "ext/traceur.js", filter: "isFile"},
		  {src:["node_modules/traceur/bin/traceur-runtime.js"], dest: "ext/traceur-runtime.js", filter: "isFile"},
		  {src:["node_modules/system-bower/bower.js"], dest: "ext/bower.js", filter: "isFile"},
		  {src:["node_modules/babel-standalone/babel.js"], dest: "ext/babel.js", filter: "isFile"},
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
			{expand: true, src: core, dest: "test/steal-module-script/node_modules/steal/", filter: "isFile"},
		  {expand: true, src: core, dest: "test/bower/bower_components/steal/", filter: "isFile"},
		  {expand: true, src: core, dest: "test/bower/npm/bower_components/steal/", filter: "isFile"},
		  {expand: true, src: ["node_modules/jquery/**"], dest: "test/npm/", filter: "isFile"},
		  {expand: true, cwd: "node_modules/system-bower/", src: ["*"], dest: "test/bower_components/system-bower/", filter: "isFile"},
		  {expand: true, cwd: "node_modules/system-bower/", src: ["*"], dest: "test/bower/bower_components/system-bower/", filter: "isFile"},
		  {expand: true, cwd: "node_modules/system-bower/", src: ["*"], dest: "test/bower/with_paths/bower_components/system-bower/", filter: "isFile"},
		  {expand: true, cwd: "node_modules/system-bower/", src: ["*"], dest: "test/bower/as_config/vendor/system-bower/", filter: "isFile"}
		]
	  },

	},
	watch: {
	  files: [ "src/*.js", "node_modules/systemjs/dist/**"],
	  tasks: "default"
	},
	jshint: {
	  options: {
		jshintrc: ".jshintrc"
	  },
	  lib: ["src/**/*.js"]
	},
	testee: {
	  windows: {
		options: {
		  browsers: ["ie"]
		},
		src: ["test/test.html"]
	  },
	  tests: {
		options: {
		  browsers: ["firefox"]
		},
		src: ["test/test.html", "test/unit_test.html"]
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

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-simple-mocha");
  grunt.loadNpmTasks("grunt-release");
  grunt.loadNpmTasks("testee");

  grunt.registerTask("test", [ "build", "testee:tests", "simplemocha" ]);
  grunt.registerTask("test-windows", [ "build", /*"testee:windows",*/ "simplemocha" ]);
  grunt.registerTask("build", [ /*"jshint", */"concat", "uglify", "copy:extensions","copy:toTest" ]);
  grunt.registerTask("default", [ "build" ]);
};
