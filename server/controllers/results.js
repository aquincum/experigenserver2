/** Handles queries that write data back to the client.
 * Specifically, `getusers` and `makeCSV`.
 * @module
 */

var Experiment = require("../models/experiment");
var util = require("../util");


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
        if(err == Experiment.NOSUCHEXPERIMENT){ // ah let's just do this
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
    var experiment = new Experiment(sourceurl, experimentName);
    experiment.getAllData(file, function(err, data){
        writeObjectsToClient(err, data, res);
    });
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
    var experiment = new Experiment(sourceurl, experimentName);
    experiment.users(function(err,data){
        writeObjectsToClient(err, data, res);
    });
};

module.exports = {
    getUsers: getUsers,
    makeCSV: makeCSV
};
