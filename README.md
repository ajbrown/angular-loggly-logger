ngLoggly is a module which will decorate Angular's $log service, and provide a
LogglyLogger service which can be used to manually send messages of any kind to
loggly.

### Status
[![Build Status](https://travis-ci.org/ajbrown/angular-loggly-logger.svg)](https://travis-ci.org/ajbrown/angular-loggly-logger)


# Getting Started

LogglyLogger can be installed with bower:

```
bower install angular-loggly-logger
```

Once configured (by including "logglyLogger" as a module dependency), the $log
service will automatically be decorated, and all messages logged will be handled
as normal as well as formated and passed to LogglyLogger.sendMessage.
The plain text messages are sent into the "json.message" field with the decorated log
while custom JSON objects are sent via "json.messageObj" field as Loggly only supports
one type per field.

To use both the decorated $log and the LogglyLogger service, you must first
configure it with an inputToken, which is done via the LogglyLoggerProvider:

```
angular.module( 'myApp', ['logglyLogger'] )

  .config( function( LogglyLoggerProvider ) {
    LogglyLoggerProvider.inputToken( '<loggly input token here>' );
  } );
  
  .run( function( LogglyLogger, $log ) {
    
    //This will be sent to both the console and Loggly
    $log.info( "I'm a little teapot." );
    
    //This will be sent to loggly only
    LogglyLogger.sendMessage( 'Short and Stout.' )
  }

```

# $log decoration

When sent through the `$log` decorator, messages will be formatted as follows:
```

// Example: $log.warn( 'Danger! Danger!' );
{ 
  level: "WARN",
  timestamp: "2014-05-01T13:10Z",
  msg: "Danger! Danger!",
  url: "https://github.com/ajbrown/angular-loggly-logger/demo/index.html",
}

// Example: $log.debug( 'User submitted something:', { foo: 'A.J', bar: 'Space' } )

{ 
  level: "DEBUG",
  timestamp: "2014-05-01T13:18Z",
  msg: ["User submitted something", { foo: 'A.J.', bar: 'Space' }],
  url: "https://github.com/ajbrown/angular-loggly-logger/demo/index.html",
}
```

> However, 'url' and 'timestamp' are not included by default.  You must enable those options in your application config (see below).


Note that if you do not call `LogglyLoggerProvider.inputToken()` in a config method, messages will not be sent to loggly.  At the moment, there is no warning -- your message is just ignored.

# Configuration

The following configuration options are available.

```
  LogglyLoggerProvider
  
    .inputToken( string ) // The token for the input logs will be sent.  If not set, no messages will be sent to loggly.
  
    .useHttps( boolean )  // Requests will be sent over HTTPS if set to true.  Default is true.
  
    .includeUrl( boolean ) // The value of $location.absUrl() will be sent as the "url" key if set to true.  Default is false.
  
    .includeTimestamp( boolean ) // The current timestamp will be included if set to true.  default is false.
    
    .inputTag("angular,customTag") // The tags will be included with the logs. default is "angular".
    
    .sendConsoleErrors( boolean ) // Sends console error stack traces to Loggly if set to true. default is false.

    .logToConsole( boolean ) // Whether to log to console, can easily turn off in produciton. Default is true.
  
```

You can also default some "extra/default" information to be sent with each log message.  When this is set, `LogglyLogger` will include the key/values provided with all messages, plus the data to be sent for each specific logging request.

```

  LogglyLoggerProvider.setExtra( { appVersion: 1.1.0, browser: 'Chrome' } );
  
  ...
  
  $log.warn( 'Danger! Danger!' )
  
  >> { appVersion: 1.1.0, browser: 'Chrome', level: 'WARN', msg: 'Danger! Danger', url: 'http://google.com' }
```

Be aware that when using `setExtra` with `LogglyLogger.sendMessage( obj )`, any properties in your `obj` that are the same as your `extra` will be overwritten.  

### TODO

- Support batching of requests.
- Support session tracking (each client sends an identifier for all logs)
