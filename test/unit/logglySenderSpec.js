'use strict';

/* jasmine specs for services go here */

describe('logglyLogger Module:', function() {
  var logglyLoggerProvider,
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
    var token = 'test123456',
      tag = 'logglyLogger',
      message, service, $log, $httpBackend;

    beforeEach(function () {
      message = {message: 'A test message'};

      inject(function ($injector) {
        $log = $injector.get('$log');
        $httpBackend = $injector.get('$httpBackend');
        service = $injector.get('LogglyLogger');
        service.attach();
      });
    });

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be registered', function () {
      expect(service).not.toBe(null);
    });

    it('will not send a message to loggly if a token is not specified', function () {
      var url = 'https://logs-01.loggly.com';
      var forbiddenCallTriggered = false;
      $httpBackend
        .when(url)
        .respond(function () {
          forbiddenCallTriggered = true;
          return [400, ''];
        });

      service.sendMessage("A test message");
      // Let test fail when request was triggered.
      expect(forbiddenCallTriggered).toBe(false);
    });

    it('will send a message to loggly only when properly configured', function () {
      var expectMessage = { message: 'A test message' };
      var tag = 'logglyLogger';
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/logglyLogger/';
      var generatedURL;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.includeUrl(false);
      logglyLoggerProvider.inputTag(tag);

      $httpBackend
        .expectPOST(testURL, expectMessage)
        .respond(function (method, url, data) {
          generatedURL = url;
          return [200, "", {}];
        });

      service.sendMessage(message);
      $httpBackend.flush();

      expect(generatedURL).toEqual(testURL);
    });

    it('will use http if useHttps is set to false', function () {
      var testURL = 'http://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
      var generatedURL;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.useHttps(false);
      logglyLoggerProvider.includeUrl(false);

      $httpBackend
        .expectPOST(testURL, message)
        .respond(function (method, url, data) {
          generatedURL = new URL(url);
          return [200, "", {}];
        });

      service.sendMessage(message);

      $httpBackend.flush();

      expect(generatedURL.protocol).toEqual('http:');

    });

    it('will include the current url if includeUrl() is not set to false', function () {
      var expectMessage = angular.extend(message, { url: 'http://bloggly.com' });
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
      var payload;

      inject(function ($injector) {
        // mock browser url
        $injector.get('$browser').url('http://bloggly.com');
      });

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( true );

      $httpBackend
        .expectPOST(testURL, expectMessage)
        .respond(function (method, url, data) {
          payload = JSON.parse(data);
          return [200, "", {}];
        });

      service.sendMessage( message );

      $httpBackend.flush();
      expect(payload.url).toEqual('http://bloggly.com');

    });

    it('will include the current userAgent if includeUserAgent() is not set to false', function () {
      var expectMessage = angular.extend(message, { userAgent: window.navigator.userAgent });
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
      var payload;

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUserAgent( true );

      $httpBackend
        .expectPOST(testURL, expectMessage)
        .respond(function (method, url, data) {
          payload = JSON.parse(data);
          return [200, "", {}];
        });

      service.sendMessage( message );

      $httpBackend.flush();
      expect(payload.userAgent).toEqual(window.navigator.userAgent);

    });

    it( 'can set extra fields using the fields method', function() {
      var extra = { appVersion: '1.1.0', browser: 'Chrome' };

      expect( service.fields( extra )).toBe( extra );
      expect( service.fields() ).toEqual( extra );
    });


    it( 'will include extra fields if set via provider and service', function() {
      var payload, payload2;
      var extra = { appVersion: '1.1.0', browser: 'Chrome' };
      var expectMessage = angular.extend(message, extra);
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';

      logglyLoggerProvider.inputToken( token );


      logglyLoggerProvider.fields( extra );
      $httpBackend
        .expectPOST(testURL, expectMessage)
        .respond(function (method, url, data) {
          payload = JSON.parse(data);
          return [200, "", {}];
        });
      service.sendMessage(message);

      $httpBackend.flush();
      expect(payload).toEqual(expectMessage);

      var expectMessage2 = angular.extend(message, { appVersion: '1.1.0', browser: 'Chrome', username: 'baldrin' });

      extra.username = "baldrin";
      service.fields( extra );
      $httpBackend
        .expectPOST(testURL, expectMessage2)
        .respond(function (method, url, data) {
          payload2 = JSON.parse(data);
          return [200, "", {}];
        });
      service.sendMessage(message);

      $httpBackend.flush();
      expect(payload2).toEqual(expectMessage2);
    });

    it( 'will include extra fields if set via the service', function() {
      var payload;
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
      var extra = { appVersion: '1.1.0', browser: 'Chrome' };
      var expectMessage = angular.extend(message, extra);

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.fields( extra );

      $httpBackend
        .expectPOST(testURL, expectMessage)
        .respond(function (method, url, data) {
          payload = JSON.parse(data);
          return [200, "", {}];
        });

      service.sendMessage(message);

      $httpBackend.flush();
      expect(payload).toEqual(expectMessage);
    });

    it( '$log has a logglySender attached', function() {
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
      var payload, expectMessage;

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( false );

      angular.forEach( levels, function (level) {
        expectMessage = angular.extend(message, { level: level });
        $httpBackend
          .expectPOST(testURL, expectMessage)
          .respond(function (method, url, data) {
            payload = JSON.parse(data);
            return [200, "", {}];
          });
        $log[level.toLowerCase()].call($log, message);
        $httpBackend.flush();
        expect(payload.level).toEqual(level);
      });
    });

    it( 'will not send messages for levels that are not enabled', function() {
      spyOn(service, 'sendMessage').and.callThrough();

      for( var a in levels ) {

        logglyLoggerProvider.level( levels[a] );

        for( var b in levels ) {

          $log[levels[b].toLowerCase()].call($log, message.message);
          if( b >= a ) {
            expect(service.sendMessage).toHaveBeenCalled();
          } else {
            expect(service.sendMessage).not.toHaveBeenCalled();
          }

          service.sendMessage.calls.reset();
        }
      }
    });

    it( 'will not send messages if logs are not enabled', function() {
      var url = 'https://logs-01.loggly.com/inputs/' + token;
      var tag = 'logglyLogger';

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.includeUrl(false);
      logglyLoggerProvider.loggingEnabled(false);
      logglyLoggerProvider.inputTag(tag);

      var forbiddenCallTriggered = false;
      $httpBackend
        .when(url)
        .respond(function () {
          forbiddenCallTriggered = true;
          return [400, ''];
        });
      service.sendMessage("A test message");
      // Let test fail when request was triggered.
      expect(forbiddenCallTriggered).toBe(false);
    });

    it( 'will disable logs after config had them enabled and not send messages', function() {
      var tag = 'logglyLogger';
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/logglyLogger/';
      var generatedURL;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.includeUrl(false);
      logglyLoggerProvider.loggingEnabled(true);
      logglyLoggerProvider.inputTag(tag);

      $httpBackend
        .expectPOST(testURL, message)
        .respond(function (method, url, data) {
          generatedURL = url;
          return [200, "", {}];
        });

      service.sendMessage(message);
      $httpBackend.flush();
      expect(generatedURL).toEqual(testURL);
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

    it('will override labels as specified', function () {
      var expectMessage = { msg: message.message };
      var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.labels({
        message: 'msg'
      });

      $httpBackend
        .whenPOST(testURL)
        .respond(function (method, url, data) {
          expect(JSON.parse(data)).toEqual(expectMessage);
          return [200, "", {}];
        });

      service.sendMessage( message );

      $httpBackend.flush();
    });
  });
});
