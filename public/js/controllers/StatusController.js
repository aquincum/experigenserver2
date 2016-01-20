module.exports = function(app){
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
};
