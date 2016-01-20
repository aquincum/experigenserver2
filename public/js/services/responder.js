module.exports = function(app){
    app.factory("responder", function($rootScope){
        return {
            respond: function (s, c){
                $rootScope.$broadcast("statusUpdate", s, c);
            }
        };
    });
};
