module.exports = function(app){
    app.controller("ExperimentDownloadController", function($scope, responder, apiService, FileSaver, Blob){
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
            });
        };
    });
};
