var $ = require("jquery");
require("digest-ajax");

module.exports = function(app){
    app.factory("authService", function($rootScope, $timeout){
        var service = {};
        var experimenter  = "";
        var password = "";
        var loggedIn = false;
        var setLoggedIn = function(li){
            loggedIn = li;
            $timeout($rootScope.$broadcast.bind($rootScope, "updateLogin"), 0);
        };
        service.getLoggedIn = function(){
            return loggedIn;
        };

        service.setExperimenter = function(x){
            experimenter = x;
        };
        service.setPassword = function(x){
            password = x;
        };

        service.login = function(cb){
            jQuery.ajaxDigest("/auth/me", {
                username: experimenter,
                password: password
            }).done(function(){
                setLoggedIn(true);
                cb(true);
            }).fail(function(){
                setLoggedIn(false);
                cb(false);
            });
        };

        service.logout = function(){
            username = "";
            password = "";
            setLoggedIn(false);
        };
        
        
        return service;
    });

};
