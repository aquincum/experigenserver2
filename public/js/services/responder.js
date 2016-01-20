module.exports = function(app){
    app.factory("responder", function($rootScope, $timeout){
        return {
            respond: function (s, c){
                console.log(s, c);
                $timeout($rootScope.$broadcast.bind($rootScope,"statusUpdate", s, c), 0);
            }
        };
    });
};
