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
    concat: {
      dist: {
        src: [
          'bower_components/es6-module-loader/dist/es6-module-loader.js',
          'bower_components/systemjs/dist/system.js',
          'src/start.js',
          'src/normalize.js',
          'src/core.js',     	// starts makeSteal 
          'src/system-extension-ext.js',
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
            + '/*\n *  ES6 Promises shim from when.js, Copyright (c) 2010-2014 Brian Cavalier, John Hann, MIT License\n */\n'
        },
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.production.js'
      }
    },
    copy: {
      toTest: {
        files: [
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'dev.js'], dest: 'test/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'dev.js'], dest: 'test/steal/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'dev.js'], dest: 'test/bower_components/steal/', filter: 'isFile'},
          {expand: true, cwd: 'bower_components/traceur/', src: ['*'], dest: 'test/bower_components/traceur/', filter: 'isFile'}
        ]
      }
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
          browsers: ['phantom'],
          urls: ['test/test.html']
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('testee');

  grunt.registerTask('test', [ /*'jshint', */'testee' ]);
  grunt.registerTask('default', [/*'jshint', */'concat', 'uglify', 'copy:toTest']);
};
