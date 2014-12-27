'use strict';
module.exports = function (grunt) {
	

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*\n *  <%= pkg.name %> v<%= pkg.version %>\n' +
        '<%= pkg.homepage ? " *  " + pkg.homepage + "\\n" : "" %>' +
        ' *  \n' +
        ' *  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */'
    },
    release: {},
    concat: {
      dist: {
        src: [
          'bower_components/es6-module-loader/dist/es6-module-loader.js',
          'bower_components/systemjs/dist/system.js',
          'src/start.js',
          'src/normalize.js',
          'src/core.js',     	// starts makeSteal
          'src/system-extension-ext.js',
          'src/system-extension-forward-slash.js',
          'node_modules/system-json/json.js',
          'src/config.js',
          'src/startup.js',
          'src/make-steal-end.js', // ends makeSteal
          'src/system-format-steal.js',
          'src/end.js'
        ],
        dest: '<%= pkg.name %>.js'
      },
      systemFormat: {
        src: [
          'src/system-format-start.js',
          'src/normalize.js',
          'src/system-format-steal.js',
          'src/system-format-end.js'
        ],
        dest: 'system-format-steal.js'
      },
      nodeMain: {
		src: [
          'src/start.js',
          'src/normalize.js',
          'src/core.js',     	// starts makeSteal
          'src/system-extension-ext.js',
          'src/system-extension-forward-slash.js',
          'src/config.js',
          'src/startup.js',
          'src/make-steal-end.js', // ends makeSteal
          'src/system-format-steal.js',
          'src/end.js'
        ],
        dest: 'main.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>\n',
        compress: {
          drop_console: true
        }
      },
      dist: {
        options: {
          banner: '<%= meta.banner %>\n'
        },
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.production.js'
      }
    },
    copy: {
    	// copy plugins that steal should contain
      extensions: {
        files: [
          {src:["node_modules/system-npm/npm.js"], dest: "ext/npm.js", filter: 'isFile'},
          {src:["node_modules/system-npm/semver.js"], dest: "ext/semver.js", filter: 'isFile'},
          {src:["bower_components/traceur/traceur.js"], dest: "ext/traceur.js", filter: 'isFile'}
        ]
      },
      toTest: {
        files: [
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'ext/**'], dest: 'test/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'ext/**'], dest: 'test/steal/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'ext/**'], dest: 'test/bower_components/steal/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'ext/**'], dest: 'test/npm/node_modules/steal/', filter: 'isFile'},
          {expand: true, src: ['node_modules/jquery/**'], dest: 'test/npm/', filter: 'isFile'}
        ]
      },
      
    },
    watch: {
      files: [ "src/*.js", "bower_components/systemjs/dist/**"],
      tasks: "default"
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: ['src/**/*.js']
    },
    testee: {
      tests: {
        options: {
          browsers: ['firefox']
        },
        src: ['test/test.html']
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('testee');
  
  grunt.registerTask('test', [ 'build', 'testee' ]);
  grunt.registerTask('build', [ /*'jshint', */'concat', 'uglify', 'copy:extensions','copy:toTest' ]);
  grunt.registerTask('default', [ 'build' ]);
};
