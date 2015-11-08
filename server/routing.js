/** Handles the routing on the server 
 * @module routing
 */
var db = require("./db");


/**
 * Posts the version of the server to the client.
 * Route is /version
 */
var postVersion = function(req, res){
    if(process.env.npm_package_version){
	res.end(process.env.npm_package_version); // npm start
    }
    else {
	var pjson = require("./package.json");
	res.end(pjson.version); // node server.js
    }
};

/**
 * Posts the userfilename/user ID to the client.
 * Route is /getuserid
 */
var getUserID = function(req, res){
    var html = req.query.sourceurl,
	expname = req.query.experimentName;
    if(!html || !expname) {
	res.end("(\"0\")");
    }
    else {
	db.getUserFileName(html, expname, function (ufn){
	    res.end("(\"" + ufn.toString() + "\")");
	});
    }
};

var routes = {
    "/version" : postVersion,
    "/getuserid" : getUserID
};

/**
 * A dictionary basically, with routes as keys and handler functions
 * as values.
 */
module.exports.routes = routes;

/**
 * Attaches the routing handlers to the server.
 * @param {Express~server} server The server to attach handlers to.
 */
module.exports.route = function doRouting(server) {
    for(var path in routes){
	server.get(path, routes[path]);
    }
};
