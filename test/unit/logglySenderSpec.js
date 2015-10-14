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

    var service, $log, imageMock;

    // helper function to parse payload of generated image url
    // pass in instantiated instance of URL with the 'src' property
    // of the mocked image as its argument. (e.g. new URL(imageMock.src))

    var parsePayload = function(constructedURL) {
      var searchPayload = constructedURL.search.slice('?PLAINTEXT='.length);
      return angular.fromJson(decodeURIComponent(searchPayload));
    };

    beforeEach(function () {
      inject(function ($injector) {
        service = $injector.get('LogglyLogger');
        service.attach();

        $log = $injector.get('$log');
      });

      // return a mock constructed Image when 'new Image()' get called
      // in the service. otherwise, when you call service.sendMessage,
      // the app actually makes a get request to the specified url

      spyOn(window, 'Image').and.callFake(function() {
        imageMock = { src: {} }
        return imageMock;
      });
    });

    afterEach(function () {
      imageMock = undefined;
    });

    it('should be registered', function () {
      expect(service).not.toBe(null);
    });

    it('will not send a message to loggly if a token is not specified', function () {
      service.sendMessage("A test message");
      expect(imageMock).toBe(undefined);
    });

    it('will send a message to loggly when properly configured', function () {
      var token = 'test123456';
      var message = { message: 'A test message' };
      var url = 'https://logs-01.loggly.com/inputs/' + token;
      var tag = 'logglyLogger';
      var generatedURL;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.includeUrl(false);
      logglyLoggerProvider.inputTag(tag);

      service.sendMessage(message);

      generatedURL = new URL(imageMock.src);
      expect(generatedURL.href).toEqual('https://logs-01.loggly.com/inputs/test123456/tag/logglyLogger/.gif?PLAINTEXT=%7B%22message%22%3A%22A%20test%20message%22%7D');
    });

    it('will use http if useHttps is set to false', function () {
      var token = 'test123456';
      var message = { message: 'A message' };
      var url = 'http://logs-01.loggly.com/inputs/' + token;
      var generatedURL;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.useHttps(false);
      logglyLoggerProvider.includeUrl(false);

      service.sendMessage(message);

      generatedURL = new URL(imageMock.src);

      expect(generatedURL.protocol).toEqual('http:');

    });

    it('will include the current url if includeUrl() is not set to false', function () {
      var token = 'test123456';
      var message = { message: 'A Test message' };
      var url = 'https://logs-01.loggly.com/inputs/' + token;
      var parsedPayload;

      inject(function ($injector) {
        // mock browser url
        $injector.get('$browser').url('http://bloggly.com');
      });

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( true );

      service.sendMessage( message );

      parsedPayload = parsePayload(new URL(imageMock.src));
      expect(parsedPayload.url).toEqual('http://bloggly.com');

    });

    it( 'can set extra fields using the fields method', function() {
      var extra = { appVersion: '1.1.0', browser: 'Chrome' };

      expect( service.fields( extra )).toBe( extra );
      expect( service.fields() ).toEqual( extra );
    });


    it( 'will include extra fields if set via provider and service', function() {
      var parsedPayload;
      var token = 'test123456';
      var extra = { appVersion: '1.1.0', browser: 'Chrome' };
      var message = 'A Test message';

      logglyLoggerProvider.inputToken( token );


      logglyLoggerProvider.fields( extra );
      service.sendMessage( { message: message } );

      parsedPayload = parsePayload(new URL(imageMock.src));
      expect(parsedPayload).toEqual( { appVersion: '1.1.0', browser: 'Chrome', message: message } );

      extra.username = "baldrin";
      service.fields( extra );
      service.sendMessage( { message: message } );

      parsedPayload = parsePayload(new URL(imageMock.src));
      expect(parsedPayload).toEqual( { appVersion: '1.1.0', browser: 'Chrome', message: message, username: "baldrin" } );

    });


    it( 'will include extra fields if set via the service', function() {
      var parsedPayload;
      var token = 'test123456';
      var extra = { appVersion: '1.1.0', browser: 'Chrome' };
      var message = 'A Test message';

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.fields( extra );

      service.sendMessage( { message: message } );

      parsedPayload = parsePayload(new URL(imageMock.src));
      expect(parsedPayload).toEqual( { appVersion: '1.1.0', browser: 'Chrome', message: message } );
    });


    it( '$log has a logglySender attached', function() {
      var token = 'test123456';
      var logMessage = { message: 'A Test Log Message' };
      var url = 'https://logs-01.loggly.com/inputs/' + token;

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( false );

      angular.forEach( levels, function (level) {
        $log[level.toLowerCase()].call($log, logMessage);
        var parsedPayload = parsePayload(new URL(imageMock.src));
        expect(parsedPayload.level).toEqual(level);
      });

    });

    it( 'will not send messages for levels that are not enabled', function() {
        var logMessage = 'A Test Log Message';

        spyOn(service, 'sendMessage').and.callThrough();

        for( var a in levels ) {

            logglyLoggerProvider.level( levels[a] );

            for( var b in levels ) {

                $log[levels[b].toLowerCase()].call($log, logMessage);
                if( b >= a ) {
                    expect(service.sendMessage).toHaveBeenCalled();
                } else {
                    expect(service.sendMessage).not.toHaveBeenCalled();
                }

                service.sendMessage.calls.reset();
            }
        }

    });

    it( 'will not fail if the logged message is null or undefined', function() {
        var undefinedMessage;
        var nullMessage = null;

        expect( function() {
            $log.debug( undefinedMessage );
        }).not.toThrow();

        expect( function() {
            $log.debug( nullMessage );
        }).not.toThrow();

    });

    it( 'can update the Loggly token', function() {
      logglyLoggerProvider.inputToken('');
      service.inputToken('foo');
      expect(logglyLoggerProvider.inputToken()).toEqual('foo');
    });


  });

});
