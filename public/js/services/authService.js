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
            return service.ajaxLocal("/auth/me", "GET")
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
        };


        /** Send an AJAX request with Local authorization.
         * We'll be using this, as Digest is more usable for direct API access like
         * from Rexperigen.
         * @returns Promise
         */
        service.ajaxLocal = function(uri, method){
            if(uri.indexOf("experimenter=") === -1){
                uri += uri.indexOf("?") === -1 ? "?" : "&";
                uri += "experimenter=" + experimenter;
            }
            if(uri.indexOf("password=") === -1){ // hope so!!
                uri += "&password=" + password;
            }
            console.log("URI1:",uri);
            if(uri.indexOf("/auth") !== -1){
                uri = uri.replace("/auth", "/local");
            }
            console.log("URI2:",uri);
            return $http({
                method: method,
                url: uri
            })    
        };

        /**
         * Send an AJAX request with Digest authorization
         * @returns Promise
         */
        service.ajaxDigest = function(uri, method){
            var newheader = "";
            if(uri.indexOf("/auth") !== -1){
                uri = uri.replace("/auth", "/digest")
            }
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
