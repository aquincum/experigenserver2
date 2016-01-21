var $ = require("jquery");
require("digest-ajax");
var reqAuthDigest = require("../../../reqAuthDigest");

module.exports = function(app){
    app.factory("authService", function($rootScope, $timeout, $http){
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
            experimenter = "";
            password = "";
            setLoggedIn(false);
        };

        /**
         * Send an AJAX request with Digest authorization
         * @returns Promise
         */
        service.ajaxDigest = function(uri, method){
            var newheader = "";
            return $http({method: method,
                          url: uri}).then(function(response){
                              return response; // No auth was needed!
                          }).catch(function(response){
                              newheader = reqAuthDigest.reqAuthDigest(uri,
                                                                      experimenter,
                                                                      password,
                                                                      method,
                                                                      response.headers);
                              return $http({method: method,
                                            url: uri,
                                            headers: {
                                                "Authorization": newheader
                                            }
                                           });
                          });
                                   
        };
        
        
        return service;
    });

};
