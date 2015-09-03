module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                jshintrc: true
            },
            files: {
                src: ['angular-loggly-logger.js']
            }
        },

        uglify: {
            options : {
                sourceMap: true
            },
            main: {
                files: { 'angular-loggly-logger.min.js': ['angular-loggly-logger.js'] }
            }
        },

        karma: {
          unit: {
            configFile: 'test/karma.conf.js'
          },
          //continuous integration mode: run tests once in PhantomJS browser.
          travis: {
            configFile: 'test/karma.conf.js',
            singleRun: true,
            browsers: ['Firefox']
          }
      },

      watch: {

          //run JSHint on JS files
          jshint: {
              files: ['angular-loggly-logger.js'],
              tasks: ['jshint']
          },

          //run unit tests with karma (server needs to be already running)
          karma: {
              files: ['*.js', '!*.min.js'],
              tasks: ['karma:unit:run'] //NOTE the :run flag
          }
      }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['jshint','uglify'] );
    grunt.registerTask('test', [ 'karma:travis' ] );
    grunt.registerTask('test-all', ['karma:unit'] );
};
