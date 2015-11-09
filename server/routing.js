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
	var pjson = require("../package.json");
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


/**
 * Writes data coming from the experiment into the database. Everything goes
 * to a collection with the hashed name. Destination (eg. demographics.csv,
 * etc.) is just a field for now, it'll be handled on download -- this is how
 * Experigen server 1 did it too.
 */
var dbWrite = function(req, res){
    function fail(){
	res.end("(\"false\")"); // this is how the cgi died
    }
    if (!req.query) return fail();
    // necessary fields
    var ufn = req.query.userFileName,
	userCode = req.query.userCode,
	experimentName = req.query.experimentName,
	sourceurl = req.query.sourceurl;
    if (!ufn || !userCode || !experimentName || !sourceurl){
	return fail();
    }
    // add IP and time
    var query = req.query;
    query.IP = req.ip;
    query.time = (new Date()).getTime();
    // let's pass on everything now to the db, I'll clean up there.
    db.write(query, function (success){
	if(success){
	    res.end("(\"true\")");
	}
	else {
	    fail();
	}
    });
};


var routes = {
    "/version" : postVersion,
    "/getuserid" : getUserID,
    "/dbwrite": dbWrite
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
