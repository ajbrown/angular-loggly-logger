; (function(angular) {

    angular.module( 'ngLoggly.demo', ['ngLoggly'] )

    .constant( 
        'logglyInputToken', 
        '<YOUR TOKEN>' 
    )

    .config( function( LogglyLoggerProvider, logglyInputToken ) {
        
        LogglyLoggerProvider
            .inputToken( logglyInputToken )
            .useHttps( true )
            .includeTimestamp( true )
            .includeUrl( true )
            .sendConsoleErrors(true)
        ;

    } )

    .controller( 'MainCtrl', function( $scope, $log ) {
        
        $scope.inputToken = null;
        $scope.message = '';

        //We can also create named loggers, similar to log4j
        var megaLog = $log.getLogger( 'MegaLogger' );

        $scope.logIt = function() {
            $log.info( $scope.message );
        };

        $scope.megaLogIt = function() {
            megaLog.warn( $scope.message );
        }
        
    })


    ;


})(window.angular);
