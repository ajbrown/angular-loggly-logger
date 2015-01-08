'use strict';

/* jasmine specs for services go here */

describe('logglyLogger Module:', function() {
  var moduleTest = this;
  var logglyLoggerProvider;

  beforeEach(function () {
    // Initialize the service provider
    // by injecting it to a fake module's config block
    var fakeModule = angular.module('testing.harness', ['logglyLogger'], function () {});
    fakeModule.config( function (LogglyLoggerProvider) {
      logglyLoggerProvider = LogglyLoggerProvider;
    });

    // Initialize test.app injector
    module('logglyLogger', 'testing.harness');

    // Kickstart the injectors previously registered
    // with calls to angular.mock.module
    inject(function () {});
  });


  describe( 'loggly service:', function() {

    var service, $log, imageMock;

    // helper function to parse payload of generated image url
    // pass in instantiated instance of URL with the 'src' proprty
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

      spyOn(window, 'Image').andCallFake(function() {
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
      var generatedURL;

      logglyLoggerProvider.inputToken(token);
      logglyLoggerProvider.includeUrl(false);

      service.sendMessage(message);

      generatedURL = new URL(imageMock.src);
      expect(generatedURL.href).toEqual('https://logs-01.loggly.com/inputs/test123456.gif?PLAINTEXT=%7B%22message%22%3A%22A%20test%20message%22%7D');
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
      var message = { msg: 'A Test message' };
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

    it( '$log has a logglySender attached', function() {
      var token = 'test123456';
      var logMessage = 'A Test Log Message';
      var url = 'https://logs-01.loggly.com/inputs/' + token;

      logglyLoggerProvider.inputToken( token );
      logglyLoggerProvider.includeUrl( false );

      angular.forEach(['DEBUG', 'INFO', 'WARN', 'ERROR'], function (level) {
        $log[level.toLowerCase()].call($log, logMessage);
        var parsedPayload = parsePayload(new URL(imageMock.src));
        expect(parsedPayload.level).toEqual(level);
      });

    });

  });

});
