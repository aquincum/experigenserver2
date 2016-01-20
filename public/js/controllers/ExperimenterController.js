var crypto = require("crypto-js");

module.exports = function(app){
    app.controller("ExperimenterController", function($scope, apiService){
        var updateLogin = function(li){
            $scope.$applyAsync(function(){
                $scope.loggedIn = li;
            });
            if(li){
                $scope.toplabel = $scope.experimenter;
            }
            else{
                $scope.toplabel = "Not logged in";
            }
        };
        $scope.experimenter = "";
        //    $scope.toplabel = ;
        $scope.password = "";
        $scope.ha1 = "";
        updateLogin(false);
        $scope.updateHA1 = function(){
            $scope.ha1 = crypto.MD5($scope.experimenter + ":Experimenters:" + $scope.password).toString();
        };
        $scope.$watch("experimenter", $scope.updateHA1);
        $scope.$watch("password", $scope.updateHA1);
        $scope.register = function(){
            var req = "/experimenter?experimenter=" + $scope.experimenter +
                "&ha1="+$scope.ha1;
            $.post(req).success(function(data){
                respond($scope.experimenter + " registered!", "success");
                updateLogin(true);
            }).fail(function(err){
                apiService.handleError(err);
            });
        };
        $scope.login = function(){
            $.ajaxDigest("/me", {
                username: $scope.experimenter,
                password: $scope.password
            }).done(function(){
                updateLogin(true);
                respond("Logged in! Welcome " + $scope.experimenter, "success");
            }).fail(function(){
                respond("Login failure!", "danger");
            });
        };
        $scope.logout = function(){
            $scope.username = "";
            $scope.password = "";
            updateLogin(false);
        };
    });
}
