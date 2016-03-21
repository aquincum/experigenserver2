/*eslint-env node*/

/** Handles the routing on the server 
 * @module
 */
var db = require("./db");
var util = require("./util");
var fs = require("fs");
var authentication = require("./authentication");
var postVersion = require("./controllers/version");
var getUserID = require("./controllers/getUserID");
var dbWrite = require("./controllers/dbWrite");
var resultsCtrl = require("./controllers/results");
var getDestinations = require("./controllers/getDestinations");
var authCtrl = require("./controllers/authenticationController");
var regCtrl = require("./controllers/registrationController");
var cleanURL = require("./controllers/cleanURL");

var routes = {
    noAuth: {
        get: {
            "/version" : postVersion,
            "/getuserid" : getUserID,
            "/dbwrite": dbWrite,
            "/makecsv": authCtrl.checkRegistration.bind(null, resultsCtrl.makeCSV),
            "/streamresults": authCtrl.checkRegistration.bind(null, resultsCtrl.streamResults),
            "/count": authCtrl.checkRegistration.bind(null, resultsCtrl.count),
            "/users": authCtrl.checkRegistration.bind(null, resultsCtrl.getUsers),
            "/destinations": authCtrl.checkRegistration.bind(null, getDestinations),
            "/experimenter": authCtrl.getExperimenter,
            "/registration": regCtrl.getRegistration,
            "/cleanurl": cleanURL
        },
        post: {
            "/experimenter": authCtrl.postExperimenter
        }
    },
    auth: {
        get: {
            "/auth/me": authCtrl.me,
            "/auth/makecsv": authCtrl.checkRegistration.bind(null, resultsCtrl.makeCSV),
            "/auth/streamresults": authCtrl.checkRegistration.bind(null, resultsCtrl.streamResults),
            "/auth/count": authCtrl.checkRegistration.bind(null, resultsCtrl.count),
            "/auth/users": authCtrl.checkRegistration.bind(null, resultsCtrl.getUsers),
            "/auth/destinations": authCtrl.checkRegistration.bind(null, getDestinations),
            "/auth/registration": regCtrl.getAllRegistrations
        },
        post: {
            "/auth/registration": regCtrl.postRegistration
        },
        put: {
            "/auth/experimenter": authCtrl.putExperimenter
        },
        delete: {
            "/auth/experimenter": authCtrl.deleteExperimenter,
            "/auth/registration": regCtrl.deleteRegistration
        }
    }
};



/**
 * A dictionary basically, with routes as keys and handler functions
 * as values. It has two added levels: so the first key is `auth` or 
 * `noAuth`, describing routes that need authentication and ones that
 * do not. The next key is the HTTP method (`get`, `post`, `put`,
 * `delete`), and finally the route.
 *
 * @example routes.auth.get.me == authCtrl.me
 */
module.exports.routes = routes;

/**
 * Attaches the routing handlers to the server.
 * @param {Express~server} server The server to attach handlers to.
 * @param {boolean} [emulate=false] Whether to emulate the 1.0 server by serving
 * .cgi addresses as well.
 */
module.exports.route = function doRouting(server, emulate) {
    routes.local = routes.auth;
    routes.digest = routes.auth;
    delete routes.auth;

    
    /** noop to run if no authentication needed */
    function noop (res, req, next) {next();}
    authentication.setup(server);
    for(var authenticated in routes){
        for(var method in routes[authenticated]){
            for(var path in routes[authenticated][method]){
                var publicPath = path;
                var authFunc = noop;
                switch(authenticated){
                case "local":
                    authFunc = authentication.authenticateLocal();
                    publicPath = path.replace("/auth/","/local/");
                    break;
                case "digest":
                    authFunc = authentication.authenticateDigest();
                    publicPath = path.replace("/auth/","/digest/");
                    //break;
                }
                server[method](
                    publicPath,
                    authFunc,
                    routes[authenticated][method][path]
                );
                console.log(path,method, "routed");
                if(emulate && authenticated == "noAuth"){
                    server[method](path + ".cgi", routes[authenticated][method][path]);
                }
            }
        }
    }
};
