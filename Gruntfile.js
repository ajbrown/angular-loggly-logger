module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
        options : { 
            sourceMap: true
        },
        main: {
            files: { 'angular-loggly-logger.min.js': ['angular-loggly-logger.js'] }
        }
    }

  });

  
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['uglify'] );  

};
