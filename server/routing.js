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


var routes = {
    "/version" : postVersion,
    "/getuserid" : getUserID,
    "/dbwrite": dbWrite,
    "/makecsv": resultsCtrl.makeCSV,
    "/users": resultsCtrl.getUsers,
    "/destinations": getDestinations
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
    for(var path in routes){
        server.get(path, routes[path]);
        if(emulate){
            server.get(path + ".cgi", routes[path]);
        }
    }
    // Do authentication routing
    authentication.route(server);
};
