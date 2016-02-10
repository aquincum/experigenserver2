module.exports = function(app){
    app.controller("RegistrationController", function($scope, $timeout, authService, responder){
        $scope.uncleanedURL = "";
        $scope.cleanedURL = "";
        $scope.URLcleaned = false;
        $scope.experimentName = "";

        $scope.doRegister = function(){
            const params = [
                "experimenter=" + authService.getExperimenter(),
                "sourceurl=" + $scope.uncleanedURL,
                "experimentName=" + $scope.experimentName
            ];
            const url = "/auth/registration?" + params.join("&");
            authService.ajaxDigest(url, "POST")
                .then(function(){
                    responder.respond("Experiment registered!", "success");
                    $scope.$parent.mainstate.registering = false;
                    $timeout($scope.$parent.$broadcast.bind($scope.$parent, "updateLogin"), 0);
                })
                .catch(function(resp){
                    switch(resp.status){
                    case 403:
                        responder.respond("Not authorized to register this experiment", "danger");
                        break;

                    default:
                        responder.respond("Error: " + resp.text, "danger");
                        break;
                    }
                });
        };
    });
};
