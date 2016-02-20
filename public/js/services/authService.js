var reqAuthDigest = require("../../../reqAuthDigest");

module.exports = function(app){
    app.factory("authService", function($rootScope, $timeout, $http){
        var service = {};
        var experimenter  = "";
        var password = "";
        var loggedIn = false;

        var setLoggedIn = function(li){
            console.log("Logged in =  ", li, "as ", experimenter, ", password is ", password);
            loggedIn = li;
            $timeout($rootScope.$broadcast.bind($rootScope, "updateLogin"), 0);
        };

        service.isLoggedIn = function(){
            return loggedIn;
        };

        service.setExperimenter = function(x){
            experimenter = x;
        };
        service.setPassword = function(x){
            password = x;
        };

        service.login = function(){
            return service.ajaxDigest("/auth/me", "GET")
                .then(function(){
                    setLoggedIn(true);
                    return true;
                }).catch(function(){
                    setLoggedIn(false);
                    return false;
                });
        };

        service.logout = function(){
            experimenter = "";
            password = "";
            setLoggedIn(false);
        };

        service.getExperimenter = function(){
            return experimenter;
        }

        /**
         * Send an AJAX request with Digest authorization
         * @returns Promise
         */
        service.ajaxDigest = function(uri, method){
            var newheader = "";
            return $http({method: method,
                          url: uri,
                          headers: {"Authorization": ""}
                         }).then(function(response){
                              console.log("No auth needed :O");
                              return response; // No auth was needed!
                          }).catch(function(response){
                              if(response.status != 401){
                                  console.log("Oy vey!");
                                  throw response;
                              }
                              console.log("HERE2");
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
/*            return $http({method: method,
                          url: uri
                         })*/
        };
        
        
        return service;
    });

};
