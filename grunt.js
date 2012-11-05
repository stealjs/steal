module.exports = function (grunt) {
	grunt.initConfig({
		pkg : '<json:package.json>',
		meta : {
			banner : '/*! <%= pkg.title || pkg.name %> - <%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		concat : {
			dist : {
				src : ['<banner:meta.banner>', 'core/*.js'],
				dest : 'steal.js'
			}
		}
	});


};
