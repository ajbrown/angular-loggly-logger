'use strict';

/* jasmine specs for services go here */

describe('ngLoggly Module:', function() {
  var moduleTest = this;
  var logglyLoggerProvider;

  beforeEach(function () {
    // Initialize the service provider
    // by injecting it to a fake module's config block
    var fakeModule = angular.module('testing.harness', ['ngLoggly'], function () {});
    fakeModule.config( function (LogglyLoggerProvider) {
      logglyLoggerProvider = LogglyLoggerProvider;
    });

    // Initialize test.app injector
    module('ngLoggly', 'testing.harness');

    // Kickstart the injectors previously registered
    // with calls to angular.mock.module
    inject(function () {});
  });

  describe( 'loggly service:', function() {

    var service, $httpBackend, $log;

    beforeEach(inject(function ($injector) {
      service = $injector.get('LogglyLogger');
      service.attach();

      $httpBackend = $injector.get('$httpBackend');
      $log = $injector.get('$log');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be registered', function () {
      expect(service).not.toBe(null);
    });

    it('will not send a message to loggly if a token is not specified', function () {
      service.sendMessage("A test message");
    });

    it('will send a message to loggly when properly configured', function () {
      var token = 'test123456';
      var message = { message: 'A test message' };
      var url = 'https://logs-01.loggly.com/inputs/' + token;

      $httpBackend.whenPOST(url, message).respond(200, { response: 'OK' });

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.includeUrl(false);

      $httpBackend.expect('POST', url, message).respond(200, { response: 'OK' });

      service.sendMessage(message);

      $httpBackend.flush();
    });

    it('will use http if useHttps is set to false', function () {
      var token = 'test123456';
      var message = { message: 'A message' };
      var url = 'http://logs-01.loggly.com/inputs/' + token;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.useHttps(false);
      logglyLoggerProvider.includeUrl(false);

      $httpBackend.expect('POST', url, message).respond(200);

      service.sendMessage(message);

      $httpBackend.flush();
    });

    it('will include the current url if includeUrl() is not set to false', function () {
      var token = 'test123456';
      var message = { msg: 'A Test message' };
      var url = 'https://logs-01.loggly.com/inputs/' + token;

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( true );

      $httpBackend.expect( 'POST', url, { msg:'A Test message', url: 'http://server/' } ).respond( 200 );

      service.sendMessage( message );

      $httpBackend.flush();
    });

    it( '$log has a logglySender attached', function() {
      var token = 'test123456';
      var logMessage = 'A Test Log Message';
      var url = 'https://logs-01.loggly.com/inputs/' + token;

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( false );

      var expected = { message: logMessage, level: 'DEBUG' }


      //DEBUG
      $httpBackend.expect( 'POST', url, expected ).respond( 200 );
      $log.debug( logMessage );
      $httpBackend.flush();

      //INFO
      expected.level = 'INFO';
      $httpBackend.expect( 'POST', url, expected ).respond( 200 );
      $log.info( logMessage );
      $httpBackend.flush();

      //WARN
      expected.level = 'WARN';
      $httpBackend.expect( 'POST', url, expected ).respond( 200 );
      $log.warn( logMessage );
      $httpBackend.flush();

      //ERROR
      expected.level = 'ERROR';
      $httpBackend.expect( 'POST', url, expected ).respond( 200 );
      $log.error( logMessage );
      $httpBackend.flush();
    });

  })



});