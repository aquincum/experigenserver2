module.exports = function(app){
    app.factory("apiService", function($http, responder, authService){
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
        var apiCall = function (request, scope){
            var li = authService.isLoggedIn();
            if(li){
                request = "auth/" + request;
            }
            var req = "/" + request + "?",
                dest = scope.getDestination();
            responder.respond("");
            req += "sourceurl=" + scope.sourceURL;
            req += "&experimentName=" + scope.experimentName;
            if(dest !== ""){
                req += "&file=" + dest;
            }

            var getPromise;
            if(li){
                getPromise = authService.ajaxDigest(req, "get");
            }
            else{
                getPromise = $http.get(req);
            }
            return getPromise.catch(function(err){
                handleError(err);
                throw err;
            });

        };
        return { apiCall: apiCall,
                 handleError: handleError};
    });

};
