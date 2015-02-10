module.exports = function(config){
    config.set({

        basePath : '../',

        files : [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'angular-loggly-logger.js',
            'test/unit/**/*.js'
        ],

        autoWatch : true,

        frameworks: ['jasmine'],

        browsers : ['Chrome','Firefox'],

        reporters: ['spec','coverage', 'coveralls'],

        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            '*.js': ['coverage']
        },

        plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-phantomjs-launcher',
            'karma-spec-reporter',
            'karma-jasmine',
            'karma-coverage',
            'karma-coveralls'
        ],

        junitReporter : {
            outputFile: 'build/reports/test-results/unit.xml',
            suite: 'unit'
        },

        coverageReporter: {
            dir : 'build/reports/coverage/',
            reporters: [
              // reporters not supporting the `file` property
              { type: 'html', subdir: 'report-html' },
              { type: 'lcov', subdir: 'report-lcov' },
              // reporters supporting the `file` property, use `subdir` to directly
              // output them in the `dir` directory
              { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
              { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
              { type: 'teamcity', subdir: '.', file: 'teamcity.txt' },
              { type: 'text', subdir: '.', file: 'text.txt' },
              { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
            ]
        }
    });
};
