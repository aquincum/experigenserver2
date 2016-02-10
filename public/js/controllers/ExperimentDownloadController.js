module.exports = function(app){
    app.controller("ExperimentDownloadController", function($scope, responder, apiService, FileSaver, Blob, authService, $timeout){
        $scope.sourceURL = "";
        $scope.experimentName = "";
        $scope.destination = "";
        $scope.destList = [];
        $scope.destListSelect = "";
        $scope.reggedExperiments = [];

        $scope.state = {
            loggedIn: false,
            surlSelected: false,
            destsDownloaded: false
        };

        $scope.getDestination = function(){
            if($scope.destList.length > 0){
                return $scope.destListSelect;
            }
            else {
                return $scope.destination;
            }
        };
        
        $scope.checkExistence = function(){ 
            apiService.apiCall("users", $scope).then(function(data){
                responder.respond("<strong>Experiment exists.</strong> There are " + (data.data.split("\n").length - 2) + " users in the database.", "success");
            });
        };
        $scope.getData = function(){
            apiService.apiCall("makecsv", $scope).then(function(data){
                responder.respond("<strong>Success!</strong> Data download should start right away.", "success");
                var blob = new Blob([data.data], {type: "octet/stream"});
                FileSaver.saveAs(blob, $scope.getDestination() || "xp.csv");
            });
        };

        $scope.$on("updateLogin", function (event){
            var li = authService.isLoggedIn();
            $scope.$apply(function(){
                $scope.state.loggedIn = li;
                $scope.state.surlSelected = $scope.state.destsDownloaded = false;
                if(!li){
                    $scope.reggedExperiments = [];
                }
                else{
                    authService.ajaxDigest("/auth/registration?experimenter=" + authService.getExperimenter(), "GET")
                        .then(function(regs){
                            $scope.reggedExperiments = regs.data;
                            $scope.state.surlSelected = false;
                            $scope.lisourceURLs = regs.data.map(function(exp){
                                return exp.sourceUrl
                            });
                        }).catch(function(err){
                            responder.respond("Error getting list of registrations: ", err);
                        });
                }
            });
        });
        $scope.findDestinations = function() {
            apiService.apiCall("destinations", $scope).then(function(data){
                var dests;
                responder.respond("Destination dropdown box populated", "success");
                if (typeof data.data === "string") {
                    dests = JSON.parse(data.data);
                }
                $scope.destination = "";
                $scope.destList = data.data;
                $scope.destListSelect = $scope.destList[0];
                $scope.state.destsDownloaded = true;
            });
        };

        $scope.surlChange = function(){
            $scope.state.surlSelected = true;
            $scope.exnames = $scope.reggedExperiments
                .filter(function(exp){
                    return exp.sourceUrl == $scope.sourceURL;
                })
                .map(function(exp){
                    return exp.experimentName;
                });
        };

        $scope.enChange = function(){
            $scope.findDestinations();
        };

        $scope.removeRegistration = function(){
            if(!$scope.state.loggedIn){
                return responder.respond("You're not logged in.", "danger");
            }
            if($scope.sourceURL.length < 1){
                return responder.respond("No sourceURL given.", "danger");
            }
            if($scope.experimentName.length < 1){
                return responder.respond("No experiment name given.", "danger");
            }
            var params = [
                "experimenter=" + authService.getExperimenter(),
                "sourceurl=" + $scope.sourceURL,
                "experimentName=" + $scope.experimentName
            ]
            var url = "/auth/registration?" + params.join("&");
            authService.ajaxDigest(url, "DELETE")
                .then(function(){
                    responder.respond("Registration deleted!", "success");
                    $timeout($scope.$broadcast.bind($scope,"updateLogin"), 0);
                })
                .catch(function(err){
                    responder.respond("Problem with deletion: " + err.text);
                });
                                   
        };

        $scope.convertURL = function(){
            apiService.simpleApiCall("cleanurl?sourceurl=" + $scope.sourceURL)
                .then(function(data){
                    $scope.sourceURL = data.data;
                }).catch(function(data){
                    responder.respond("Error cleaning url, possibly illegal characters. Make sure there are no hyphens in the URL!", "danger");
                });
        };
    });
};
