/*eslint-env node*/

/** Handles the routing on the server 
 * @module routing
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

var routes = {
    noAuth: {
        get: {
            "/version" : postVersion,
            "/getuserid" : getUserID,
            "/dbwrite": dbWrite,
            "/makecsv": resultsCtrl.makeCSV,
            "/users": resultsCtrl.getUsers,
            "/destinations": getDestinations,
            "/experimenter": authCtrl.getExperimenter
        },
        post: {
            "/experimenter": authCtrl.postExperimenter
        }
    },
    auth: {
        get: {
            "/me": authCtrl.me,
        },
        put: {
            "/experimenter": authCtrl.putExperimenter
        },
        delete: {
            "/experimenter": authCtrl.deleteExperimenter
        }
    }
};

/**
 * A dictionary basically, with routes as keys and handler functions
 * as values.
 */
module.exports.routes = routes;

/**
 * Attaches the routing handlers to the server.
 * @param {Express~server} server The server to attach handlers to.
 * @param {boolean} [emulate=false] Whether to emulate the 1.0 server by serving
 * .cgi addresses as well.
 */
module.exports.route = function doRouting(server, emulate) {
    function noop (res, req, next) {next();}
    authentication.setup(server);
    for(var authenticated in routes){
        for(var method in routes[authenticated]){
            for(var path in routes[authenticated][method]){
                server[method](
                    path,
                    authenticated == "auth" ?
                        authentication.authenticate() :
                        noop,
                    routes[authenticated][method][path]
                );
                if(emulate && authenticated == "noAuth"){
                    server[method](path + ".cgi", routes[authenticated][method][path]);
                }
            }
        }
    }
};
