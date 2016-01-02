'use strict';

/* jasmine specs for services go here */

describe('logglyLogger Module:', function () {
    var logglyLoggerProvider,
        moduleTest = this,
        levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

    beforeEach(function () {
        // Initialize the service provider
        // by injecting it to a fake module's config block
        var fakeModule = angular.module('testing.harness', ['logglyLogger'], function () { });
        fakeModule.config(function (LogglyLoggerProvider) {
            logglyLoggerProvider = LogglyLoggerProvider;
        });

        // Initialize test.app injector
        module('logglyLogger', 'testing.harness');

        // Kickstart the injectors previously registered
        // with calls to angular.mock.module
        inject(function () { });
    });


    describe('LogglyLoggerProvider', function () {

        it('can have a logging level configured', function () {

            for (var i in levels) {
                logglyLoggerProvider.level(levels[i]);
                expect(logglyLoggerProvider.level()).toEqual(levels[i]);
            }
        });


        it('will throw an exception if an invalid level is supplied', function () {

            expect(function () { logglyLoggerProvider.level('TEST') }).toThrow();
        });

        it('can determine if a given level is enabled', function () {
            for (var a in levels) {

                logglyLoggerProvider.level(levels[a]);

                for (var b in levels) {
                    expect(logglyLoggerProvider.isLevelEnabled(levels[b])).toBe(b >= a);
                }
            }
        });

        it('can specify extra fields to be sent with each log message', function () {

            var extra = { "test": "extra" };

            logglyLoggerProvider.fields(extra);

            expect(logglyLoggerProvider.fields()).toEqual(extra);

        });

    });

    describe('LogglyLogger', function () {

        var service, $log, $httpBackend;

        beforeEach(function () {
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
            var token = 'test123456';
            var message = { message: 'A test message' };
            var expectMessage = { message: 'A test message' };
            var url = 'https://logs-01.loggly.com/inputs/' + token;
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
            var token = 'test123456';
            var message = { message: 'A message' };
            var expectMessage = { message: 'A message' };
            var url = 'http://logs-01.loggly.com/inputs/' + token;
            var testURL = 'http://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
            var generatedURL;

            logglyLoggerProvider.inputToken(token);
            logglyLoggerProvider.useHttps(false);
            logglyLoggerProvider.includeUrl(false);

            $httpBackend
              .expectPOST(testURL, expectMessage)
              .respond(function (method, url, data) {
                  generatedURL = new URL(url);
                  return [200, "", {}];
              });

            service.sendMessage(message);
            $httpBackend.flush();

            expect(generatedURL.protocol).toEqual('http:');

        });

        it('will include the current url if includeUrl() is not set to false', function () {
            var token = 'test123456';
            var message = { message: 'A Test message' };
            var expectMessage = { message: 'A Test message', url: 'http://bloggly.com' };
            var url = 'https://logs-01.loggly.com/inputs/' + token;
            var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
            var payload;

            inject(function ($injector) {
                // mock browser url
                $injector.get('$browser').url('http://bloggly.com');
            });

            logglyLoggerProvider.inputToken(token);
            logglyLoggerProvider.includeUrl(true);

            $httpBackend
              .expectPOST(testURL, expectMessage)
              .respond(function (method, url, data) {
                  payload = JSON.parse(data);
                  return [200, "", {}];
              });

            service.sendMessage(message);
            $httpBackend.flush();

            expect(payload.url).toEqual('http://bloggly.com');

        });

        it('can set extra fields using the fields method', function () {
            var extra = { appVersion: '1.1.0', browser: 'Chrome' };

            expect(service.fields(extra)).toBe(extra);
            expect(service.fields()).toEqual(extra);
        });

        it('will include extra fields if set via provider and service', function () {
            var payload, payload2;
            var token = 'test123456';
            var extra = { appVersion: '1.1.0', browser: 'Chrome' };
            var message = 'A Test message';
            var expectMessage = { appVersion: "1.1.0", browser: "Chrome", message: "A Test message" };
            var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';

            logglyLoggerProvider.inputToken(token);
            logglyLoggerProvider.fields(extra);

            $httpBackend
              .expectPOST(testURL, expectMessage)
              .respond(function (method, url, data) {
                  payload = JSON.parse(data);
                  return [200, "", {}];
              });

            service.sendMessage({ message: message });
            $httpBackend.flush();

            expect(payload).toEqual({ appVersion: '1.1.0', browser: 'Chrome', message: message });

            var expectMessage2 = { appVersion: '1.1.0', browser: 'Chrome', username: 'baldrin', message: 'A Test message' };

            extra.username = "baldrin";
            service.fields(extra);

            $httpBackend
              .expectPOST(testURL, expectMessage2)
              .respond(function (method, url, data) {
                  payload2 = JSON.parse(data);
                  return [200, "", {}];
              });

            service.sendMessage({ message: message });
            $httpBackend.flush();

            expect(payload2).toEqual({ appVersion: '1.1.0', browser: 'Chrome', username: 'baldrin', message: message });

        });

        it('will include extra fields if set via the service', function () {
            var payload;
            var token = 'test123456';
            var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
            var extra = { appVersion: '1.1.0', browser: 'Chrome' };
            var message = 'A Test message';
            var expectMessage = { appVersion: '1.1.0', browser: 'Chrome', message: message };

            logglyLoggerProvider.inputToken(token);
            logglyLoggerProvider.fields(extra);

            $httpBackend
              .expectPOST(testURL, expectMessage)
              .respond(function (method, url, data) {
                  payload = JSON.parse(data);
                  return [200, "", {}];
              });

            service.sendMessage({ message: message });
            $httpBackend.flush();

            expect(payload).toEqual({ appVersion: '1.1.0', browser: 'Chrome', message: message });
        });

        it('$log has a logglySender attached', function () {
            var token = 'test123456';
            var logMessage = { message: 'A Test Log Message' };
            var url = 'https://logs-01.loggly.com/inputs/' + token;
            var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/AngularJS/';
            var payload, expectMessage;

            logglyLoggerProvider.inputToken(token);
            logglyLoggerProvider.includeUrl(false);

            angular.forEach(levels, function (level) {

                expectMessage = { message: 'A Test Log Message', level: level };

                $httpBackend
                  .expectPOST(testURL, expectMessage)
                  .respond(function (method, url, data) {
                      payload = JSON.parse(data);
                      return [200, "", {}];
                  });

                $log[level.toLowerCase()].call($log, logMessage);
                $httpBackend.flush();

                expect(payload.level).toEqual(level);
            });

        });

        it('will not send messages if logs are not enabled', function () {
            var token = 'test123456';
            var message = { message: 'A test message' };
            var expectMessage = { message: 'A test message' };
            var url = 'https://logs-01.loggly.com/inputs/' + token;
            var tag = 'logglyLogger';
            var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/logglyLogger/';
            var generatedURL;

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

        it('will disable logs after config had them enabled and not send messages', function () {
            var token = 'test123456';
            var message = { message: 'A test message' };
            var expectMessage = { message: 'A test message' };
            var url = 'https://logs-01.loggly.com/inputs/' + token;
            var tag = 'logglyLogger';
            var testURL = 'https://logs-01.loggly.com/inputs/test123456/tag/logglyLogger/';
            var generatedURL;

            logglyLoggerProvider.inputToken(token);
            logglyLoggerProvider.includeUrl(false);
            logglyLoggerProvider.loggingEnabled(true);
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

        it('will not send messages for levels that are not enabled', function () {
            var logMessage = 'A Test Log Message';

            spyOn(service, 'sendMessage').and.callThrough();

            for (var a in levels) {

                logglyLoggerProvider.level(levels[a]);

                for (var b in levels) {

                    $log[levels[b].toLowerCase()].call($log, logMessage);
                    if (b >= a) {
                        expect(service.sendMessage).toHaveBeenCalled();
                    } else {
                        expect(service.sendMessage).not.toHaveBeenCalled();
                    }

                    service.sendMessage.calls.reset();
                }
            }

        });

        it('will not fail if the logged message is null or undefined', function () {
            var undefinedMessage;
            var nullMessage = null;

            expect(function () {
                $log.debug(undefinedMessage);
            }).not.toThrow();

            expect(function () {
                $log.debug(nullMessage);
            }).not.toThrow();

        });

    });

});