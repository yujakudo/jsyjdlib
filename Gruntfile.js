module.exports = function(grunt){
	var files = {
		src:	[
			'lib/yjd/base.js',
			'lib/yjd/str.js',
			'lib/yjd/cskey.js',
			'lib/yjd/ajax.js',
			'lib/yjd/atm.js',
			'lib/yjd/loader.js',
			'lib/yjd/wdg/wdg.js',
			'lib/yjd/wdg/menu.js',
			'lib/yjd/wdg/statusbar.js',
			'lib/yjd/wdg/button.js',
			'lib/yjd/wdg/dialog.js',
		],
		srcCss:	[
			'lib/yjd/wdg/theme.css',
			'lib/yjd/wdg/wdg.css',
			'lib/yjd/wdg/menu.css',
			'lib/yjd/wdg/statusbar.css',
			'lib/yjd/wdg/dialog.css',
		],
		get: function(name, pattern, s_replace) {
			if(!pattern)	return this[name];
			return this[name].map(function(fn){
				return fn.replace(pattern, s_replace);
			});
		},
		getAbs: function(name) {
			return this[name].map(function(fn){
				return __dirname+'/'+fn;
			});
		}
	};

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint:	{
			options: {
				laxbreak:	true,
				sub:		true,
				esversion: 5
			},
			files:	[	'lib/**/*.js', 'tasks/*.js'	]
		},
		makeWatch:	{
			options: {
				gruntfile:	'Gruntfile.js',
				watchfile:	'tmp/grunt.watch.json',
			},
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.task.loadTasks('./tasks');

	grunt.registerTask('default', ['clean', 'all', 'watch']);
	grunt.registerTask('all', grunt.config.get('makeWatch').allTargets);
}
