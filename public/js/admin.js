var app = angular.module("adminApp", []);
app.controller("StatusController", function($scope){
    $scope.status = {
        text: "Welcome!",
        alert: "info"
    };
    $scope.$on("statusUpdate",  function (event, s, alertstatus){
        //        $scope.apply(function(){
        $scope.status.text = s;
        if(alertstatus) {
            $scope.status.alert = alertstatus;
        }
//        });
    });
});
app.factory("responder", function($rootScope){
    return {
        respond: function (s, c){
            $rootScope.$broadcast("statusUpdate", s, c);
        }
    };
});

app.factory("apiService", function($http, responder){
    var handleError = function(err){
            switch(err.status){
            case 400:
                responder.respond("Problem with the request. " + err.data, "danger");
                break;
            case 403:
                responder.respond("Unauthorized request! " + err.data, "danger");
                break;
            case 404:
                responder.respond("Experiment does not exist!", "danger");
                break;
            case 409:
                responder.respond("Cannot create a new one, it already exists!", "danger");
                break;
            case 500:
                responder.respond("Internal server error :( " + err.data, "danger");
                break;
            default:
                responder.respond("Odd error :O status code " + err.status + ", message: " + err.data, "danger");
            }
    };
    var apiCall = function (request, scope, callback){
            var req = "/" + request + "?",
                dest = scope.getDestination();
            responder.respond("");
            req += "sourceurl=" + scope.sourceURL;
            req += "&experimentName=" + scope.experimentName;
            if(dest !== ""){
                req += "&file=" + dest;
            }
            
            $http.get(req)
                .then(function(data){
                    callback(data);
                })
                .catch(function(err){
                    handleError(err);
                });
    };
    return { apiCall: apiCall,
             handleError: handleError};
});

app.controller("ExperimentDownloadController", function($scope, responder, apiService, $window){
    $scope.sourceURL = "";
    $scope.experimentName = "";
    $scope.destination = "";
    $scope.destList = [];
    $scope.destListSelect = "";

    $scope.getDestination = function(){
        if($scope.destList.length > 0){
            return $scope.destListSelect;
        }
        else {
            return $scope.destination;
        }
    };
    
    $scope.checkExistence = function(){ 
        apiService.apiCall("users", $scope, function(data){
            responder.respond("<strong>Experiment exists.</strong> There are " + (data.split("\n").length - 2) + " users in the database.", "success");
        });
    };
    $scope.getData = function(){
        apiService.apiCall("makecsv", $scope, function(data){
            responder.respond("<strong>Success!</strong> Data download should start right away.", "success");
            var blob = new Blob([data], {type: "octet/stream"}),
                url = $window.URL.createObjectURL(blob),
                a = $window.document.createElement("a");
            $window.document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = $scope.getDestination() || "xp.csv";
            a.target = "_blank";
            a.click();
            $window.URL.revokeObjectURL(url);
        });
    };

    $scope.findDestinations = function() {
        apiService.apiCall("destinations", $scope, function(data){
            responder.respond("Destination dropdown box populated", "success");
            var dests = JSON.parse(data);
            $scope.destination = "";
            $scope.destList = data;
        });
    };
});

app.controller("ExperimenterCtrl", function($scope, apiService){
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
        $scope.ha1 = CryptoJS.MD5($scope.experimenter + ":Experimenters:" + $scope.password).toString();
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
