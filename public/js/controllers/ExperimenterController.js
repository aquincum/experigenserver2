var crypto = require("crypto-js");

module.exports = function(app){
    app.controller("ExperimenterController", function($scope, apiService, authService,responder, $http){
        var updateLogin = function(){
            var li = authService.isLoggedIn();
//            $scope.$apply(function(){
                $scope.loggedIn = li;
                if(li){
                    $scope.toplabel = $scope.experimenter;
                }
                else{
                    $scope.toplabel = "Not logged in";
                }
//            });
        };
        $scope.experimenter = "";
        //    $scope.toplabel = ;
        $scope.password = "";
        $scope.loggedIn = false;

        updateLogin(false);
        $scope.$on("updateLogin", function(event, loggedin){
            updateLogin();
        });
        $scope.updateHA1 = function(){
            $scope.ha1 = crypto.MD5($scope.experimenter + ":Experimenters:" + $scope.password).toString();
        };
        $scope.register = function(){
            var req = "/experimenter?experimenter=" + $scope.experimenter +
                "&ha1="+(crypto.MD5($scope.experimenter + ":Experimenters:" + $scope.password).toString());
            $http.post(req).then(function(data){
                responder.respond($scope.experimenter + " registered!", "success");
                $scope.login();
            }).catch(function(err){
                apiService.handleError(err);
            });
        };
        $scope.login = function(){
            authService.setExperimenter($scope.experimenter);
            authService.setPassword($scope.password);
            authService.login().then(function(loggedin){
                if(loggedin){
                    responder.respond("Logged in! Welcome " + $scope.experimenter, "success");
                }
                else{
                    responder.respond("Login failure!", "danger");
                }
            });
        };
        $scope.logout = function(){
            $scope.username = "";
            $scope.password = "";
            authService.logout();
        };
    });
};
