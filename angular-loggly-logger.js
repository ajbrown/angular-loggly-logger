/**
 *  logglyLogger is a module which will send your log messages to a configured
 *  [Loggly](http://loggly.com) connector.
 *
 *  Major credit should go to Thomas Burleson, who's highly informative blog
 *  post on [Enhancing AngularJs Logging using Decorators](http://bit.ly/1pOI0bb)
 *  provided the foundation (if not the majority of the brainpower) for this
 *  module.
 */
; (function( angular ) {
  "use strict";

  angular.module( 'logglyLogger.logger', [] )
    .provider( 'LogglyLogger', function() {
      var self = this;

      var logSuccessHandler;
      var logFailureHandler;

      var logLevels = [ 'DEBUG', 'INFO', 'WARN', 'ERROR' ];

      var https = true;
      var extra = {};
      var includeCurrentUrl = false;
      var includeTimestamp = false;
      var tag = null;
      var sendConsoleErrors = false;
      var logToConsole = true;

      // The minimum level of messages that should be sent to loggly.
      var level = 0;

      var token = null;
      var endpoint = '://logs-01.loggly.com/inputs/';

        var buildUrl = function ( data ) {
          var msg = encodeURIComponent( angular.toJson( data ) );
          return (https ? 'https' : 'http') + endpoint + token + (tag ? '/tag/'+ tag +'/': '') + '.gif?PLAINTEXT=' + msg;
        };

      this.setExtra = function (d) {
        extra = d;
        return self;
      };

      this.fields = function ( d ) {
        if( angular.isDefined( d ) ) {
          extra = d;
          return self;
        }

        return extra;
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

      this.inputTag = function (usrTag){
        if (angular.isDefined(usrTag)) {
          tag = usrTag;
          return self;
        }

        return tag;
      };

      this.sendConsoleErrors = function (flag){
        if (angular.isDefined(flag)) {
          sendConsoleErrors = !!flag;
          return self;
        }

        return sendConsoleErrors;
      };

      this.level = function ( name ) {

        if( angular.isDefined( name ) ) {
          var newLevel = logLevels.indexOf( name.toUpperCase() );

          if( newLevel < 0 ) {
            throw "Invalid logging level specified: " + name;
          } else {
            level = newLevel;
          }

          return self;
        }

        return logLevels[level];
      };

      this.isLevelEnabled = function( name ) {
        return logLevels.indexOf( name.toUpperCase() ) >= level;
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

          var sentData = angular.extend({}, extra, data);

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

        var inputToken = function(s) {
          if (angular.isDefined(s)) {
            token = s;
          }

          return token;
        };

        return {
          lastLog: function(){ return lastLog },
          sendConsoleErrors: function(){ return sendConsoleErrors },
          level : function() { return level },
          isLevelEnabled : self.isLevelEnabled,
          attach: attach,
          sendMessage: sendMessage,
          logToConsole: logToConsole,
          inputToken: inputToken,

          /**
           * Get or set the fields to be sent with all logged events.
           * @param d
           * @returns {*}
           */
          fields: function( d ) {
            if( angular.isDefined( d ) ) {
              self.fields( d );
            }
            return self.fields();
          }
        }
      }];

    } );


  angular.module( 'logglyLogger', ['logglyLogger.logger'] )
    .config( [ '$provide', function( $provide ) {

      $provide.decorator('$log', [ "$delegate", '$injector', function ( $delegate, $injector ) {

        var logger = $injector.get('LogglyLogger');

        // install a window error handler
        if(logger.sendConsoleErrors() === true) {
          var _onerror = window.onerror;

          //send console error messages to Loggly
          window.onerror = function (msg, url, line, col) {
            logger.sendMessage({
              level : 'ERROR',
              message: msg,
              url: url,
              line: line,
              col: col
            });

            if (_onerror && typeof _onerror === 'function') {
              _onerror.apply(window, arguments);
            }
          };
        }

        var wrapLogFunction = function(logFn, level, loggerName) {

          var wrappedFn = function () {
            var args = Array.prototype.slice.call(arguments);

            if(logger.logToConsole) {
              logFn.apply(null, args);
            }

            // Skip messages that have a level that's lower than the configured level for this logger.
            if( !logger.isLevelEnabled( level ) ) {
              return;
            }

            var msg = (args.length == 1 ? args[0] : args) || {};
            var sending = { level: level };

            if(angular.isDefined(msg.stack) || (angular.isDefined(msg[0]) && angular.isDefined(msg[0].stack))) {
              //handling console errors
              if(logger.sendConsoleErrors() === true){
                sending.message = msg.message || msg[0].message;
                sending.stack = msg.stack || msg[0].stack;
              }
              else {
                return;
              }
            }
            else if(angular.isObject(msg)) {
              //handling JSON objects
              sending = angular.extend({}, msg, sending);
            }
            else{
              //sending plain text
              sending.message = msg;
            }

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
            debug:  wrapLogFunction( _$log.debug, 'DEBUG', name ),
            info:   wrapLogFunction( _$log.info, 'INFO', name ),
            warn:   wrapLogFunction( _$log.warn, 'WARN', name ),
            error:  wrapLogFunction( _$log.error, 'ERROR', name )
          }
        };

        //wrap the existing API
        $delegate.log =    wrapLogFunction($delegate.log, 'INFO');
        $delegate.debug =  wrapLogFunction($delegate.debug, 'DEBUG');
        $delegate.info =   wrapLogFunction($delegate.info, 'INFO');
        $delegate.warn =   wrapLogFunction($delegate.warn, 'WARN');
        $delegate.error =  wrapLogFunction($delegate.error, 'ERROR');

        //Add some methods
        $delegate.getLogger = getLogger;

        return $delegate;
      }]);

    }]);



})(window.angular);
