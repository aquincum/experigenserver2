/*eslint-env node*/

/** Handles the routing on the server 
 * @module routing
 */
var db = require("./db");
var util = require("./util");
var fs = require("fs");

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


/**
 * Takes the experiment name and source URL as argument and returns 
 * the CSV. Directs it from a different destination if destination
 * is not empty.
 * Alert: the output is a *TSV* not a CSV, as per the old server.
 */
var makeCSV = function(req, res){
    function fail(){
        res.end("false\n"); // this is how the cgi died
    }
    if (!req.query) return fail();
    var experimentName = req.query.experimentName,
        sourceurl = req.query.sourceurl,
        file = req.query.file;
    if (!experimentName || !sourceurl){
        return fail();
    }
    if(!file){
        file = "default.csv";
    }
    db.getAllData(sourceurl, experimentName, file, function(err, data){
        writeObjectsToClient(err, data, res);
    });
};


/**
 * Writes out an array of Objects or an error response. Used by both
 * makecsv and users.
 * @param err Error object or null if no error
 * @param {Object[]} data Array of objects to write out
 * @param {Express.response} res The response object.
 * @param {Function} [cb] An optional callback to be called after
 * writeout
 */
var writeObjectsToClient = function(err, data, res, cb){
    if(err){
        if(err == db.NOSUCHEXPERIMENT){ // ah let's just do this
            res.end("No such experiment!");
        }
        else {
            res.end("Error: " + err);
        }
    }
    else {
        var fields = util.getAllFieldNames(data);// to be impl
        res.write(fields.join("\t") + "\n"); // header
        data.forEach(function(line){
            res.write(util.formTSVLine(line, fields));
        });
        res.end();
        if(cb){
            res.on("finish", cb);
        }
    }
};


/**
 * Returns the usercode/number of records table.
 */
var getUsers = function(req, res){
    function fail(){
        res.end("false\n"); // this is how the cgi died
    }
    if (!req.query) return fail();
    var experimentName = req.query.experimentName,
        sourceurl = req.query.sourceurl;
    if (!experimentName || !sourceurl){
        return fail();
    }
    db.users(sourceurl, experimentName, function(err,data){
        writeObjectsToClient(err, data, res);
    });
};

var routes = {
    "/version" : postVersion,
    "/getuserid" : getUserID,
    "/dbwrite": dbWrite,
    "/makecsv": makeCSV,
    "/users": getUsers
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
};
