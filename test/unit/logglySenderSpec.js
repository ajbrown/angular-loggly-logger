'use strict';

/* jasmine specs for services go here */

describe('logglyLogger Module:', function() {
  var logglyLoggerProvider,
      moduleTest = this,
      levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

  beforeEach(function () {
    // Initialize the service provider
    // by injecting it to a fake module's config block
    var fakeModule = angular.module('testing.harness', ['logglyLogger'], function () {});
    fakeModule.config( function(LogglyLoggerProvider) {
      logglyLoggerProvider = LogglyLoggerProvider;
    });

    // Initialize test.app injector
    module('logglyLogger', 'testing.harness');

    // Kickstart the injectors previously registered
    // with calls to angular.mock.module
    inject(function() {});
  });


  describe( 'LogglyLoggerProvider', function() {

    it( 'can have a logging level configured', function() {

        for( var i in levels ) {
            logglyLoggerProvider.level( levels[i] );
            expect( logglyLoggerProvider.level() ).toEqual( levels[i] );
        }
    });


    it( 'will throw an exception if an invalid level is supplied', function() {

        expect( function() { logglyLoggerProvider.level('TEST') } ).toThrow();
    });

    it( 'can determine if a given level is enabled', function() {
        for( var a in levels ) {

            logglyLoggerProvider.level( levels[a] );

            for( var b in levels ) {
                expect( logglyLoggerProvider.isLevelEnabled( levels[b] )).toBe( b >= a );
            }
        }
    });

    it( 'can specify extra fields to be sent with each log message', function() {

      var extra = { "test": "extra" };

      logglyLoggerProvider.fields( extra );

      expect( logglyLoggerProvider.fields()).toEqual( extra );

    });

  });

  describe( 'LogglyLogger', function() {

    var service, $log;

    beforeEach(function () {
      inject(function ($injector) {
        service = $injector.get('LogglyLogger');
        service.attach();

        $log = $injector.get('$log');
      });
      
    });

    afterEach(function () {
      
    });

  });

});
