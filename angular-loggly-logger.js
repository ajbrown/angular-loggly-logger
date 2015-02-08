/**
 *  ngLoggly is a module which will send your log messages to a configured
 *  [Loggly](http://loggly.com) connector.
 *
 *  Major credit should go to Thomas Burleson, who's highly informative blog
 *  post on [Enhancing AngularJs Logging using Decorators](http://bit.ly/1pOI0bb)
 *  provided the foundation (if not the majority of the brainpower) for this
 *  module.
 */
; (function( angular ) {
  "use strict";

  angular.module( 'ngLoggly.logger', [] )
    .provider( 'LogglyLogger', function() {
        var self = this;

        var logSuccessHandler;
        var logFailureHandler;

        var https = true;
        var extra = {};
        var includeCurrentUrl = false;
        var includeTimestamp = false;
        var logToConsole = true;

        var token = null;
        var endpoint = '://logs-01.loggly.com/inputs/';

        var buildUrl = function ( data ) {
          var msg = encodeURIComponent( angular.toJson( data ) );
          return (https ? 'https' : 'http') + endpoint + token + '.gif?PLAINTEXT=' + msg;
        };

        this.setExtra = function (d) {
          extra = d;
          return self;
        };

        this.inputToken = function ( s ) {
          if (angular.isDefined(s)) {
            token = s;
            return self;
          }

          return token;
        };

        this.useHttps = function (flag) {
          if (angular.isDefined(flag)) {
            https = !!flag;
            return self;
          }

          return https;
        };

        this.includeUrl = function (flag) {
          if (angular.isDefined(flag)) {
            includeCurrentUrl = !!flag;
            return self;
          }

          return includeCurrentUrl;
        };

        this.includeTimestamp = function (flag) {
          if (angular.isDefined(flag)) {
            includeTimestamp = !!flag;
            return self;
          }

          return includeTimestamp;
        };

        this.logToConsole = function (flag) {
          if (angular.isDefined(flag)) {
            logToConsole = !!flag;
            return self;
          }

          return logToConsole;
        };

        this.$get = [ '$injector', function ($injector) {

          var lastLog = null;

          /**
           * Send the specified data to loggly as a json message.
           * @param data
           */
          var sendMessage = function (data) {
            //If a token is not configured, don't do anything.
            if (!token) {
              return;
            }

            //TODO we're injecting this here to resolve circular dependency issues.  Is this safe?
            var $location = $injector.get( '$location' );

            lastLog = new Date();

            var sentData = angular.extend(extra, data, {}),
              headers = {
                  'Content-Type': 'application/x-www-form-urlencoded'
              };

            if (includeCurrentUrl) {
              sentData.url = $location.absUrl()
            }

            if( includeTimestamp ) {
              sentData.timestamp = lastLog.toISOString();
            }

            //Loggly's API doesn't send us cross-domain headers, so we can't interact directly
            new Image().src = buildUrl(sentData);
          };

          var attach = function() {
          };

          return {
            logToConsole: logToConsole,
            lastLog: function(){ return lastLog },
            attach: attach,
            sendMessage: sendMessage
          }
        }];

    } );


    angular.module( 'ngLoggly', ['ngLoggly.logger'] )
      .config( [ '$provide', function( $provide ) {

        $provide.decorator('$log', [ "$delegate", '$injector', function ( $delegate, $injector ) {


          var wrapLogFunction = function(logFn, level, loggerName) {

            var logger = $injector.get('LogglyLogger');

            var wrappedFn = function () {
              var args = Array.prototype.slice.call(arguments);

              if(logger.logToConsole) {
                logFn.apply(null, args);
              }

              var msg = args.length == 1 ? args[0] : args;
              var sending = { level: level, message: msg };
              if( loggerName ) {
                sending.logger = msg
              }

              //Send the message to through the loggly sender
              logger.sendMessage( sending );
            };

            wrappedFn.logs = [];

            return wrappedFn;
          };

          var _$log = (function ($delegate) {
            return {
              log: $delegate.log,
              info: $delegate.info,
              warn: $delegate.warn,
              error: $delegate.error
            };
          })($delegate);

          var getLogger = function ( name ) {
            return {
              log:    wrapLogFunction( _$log.log, 'INFO', name ),
              info:   wrapLogFunction( _$log.info, 'INFO', name ),
              warn:   wrapLogFunction( _$log.warn, 'WARN', name ),
              debug:  wrapLogFunction( _$log.debug, 'DEBUG', name ),
              error:  wrapLogFunction( _$log.error, 'ERROR', name )
            }
          };

          //wrap the existing API
          $delegate.log =    wrapLogFunction($delegate.log, 'INFO');
          $delegate.info =   wrapLogFunction($delegate.info, 'INFO');
          $delegate.warn =   wrapLogFunction($delegate.warn, 'WARN');
          $delegate.debug =  wrapLogFunction($delegate.debug, 'DEBUG');
          $delegate.error =  wrapLogFunction($delegate.error, 'ERROR');

          //Add some methods
          $delegate.getLogger = getLogger;

          return $delegate;
        }]);

      }]);



})(window.angular);

