; (function(angular) {

    angular.module( 'logglyLogger.demo', ['logglyLogger'] )

    .constant(
        'logglyInputToken',
        'a3f1b26a-5d19-4553-a6e0-e7fb4bbdef8e'
    )

    .config( function( LogglyLoggerProvider, logglyInputToken ) {

        LogglyLoggerProvider
            .inputToken( logglyInputToken )
            .useHttps( true )
            .includeTimestamp( true )
            .includeUrl( true )
            .sendConsoleErrors(true)
            .logToConsole(true)
        ;

    } )

    .controller( 'MainCtrl', function( $scope, $log, LogglyLogger) {

        $scope.inputToken = null;
        $scope.message = '';
        $scope.extra = '{}';

        //We can also create named loggers, similar to log4j
        var megaLog = $log.getLogger( 'MegaLogger' );

        $scope.updateExtra = function() {
          LogglyLogger.fields( angular.fromJson( $scope.extra ) );
          $log.info( "Updated fields:", LogglyLogger.fields() );
        };

        $scope.logIt = function() {
            $log.info( $scope.message );
        };

        $scope.megaLogIt = function() {
            megaLog.warn( $scope.message );
        };

    })


    ;


})(window.angular);
