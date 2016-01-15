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
 */
var writeObjectsToClient = function(err, data, res){
    if(err){
        if(err == Experiment.NOSUCHEXPERIMENT){ // ah let's just do this
            res.status(404).end("No such experiment!");
        }
        else {
            res.status(500).end("Error: " + err);
        }
    }
    else {
        var fields = util.getAllFieldNames(data);// to be impl
        res.write(fields.join("\t") + "\n"); // header
        data.forEach(function(line){
            res.write(util.formTSVLine(line, fields));
        });
        res.status(200).end();
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
    experiment.getAllData(file).then(function(data){
        writeObjectsToClient(null, data, res);
    }).catch(function(err){
        writeObjectsToClient(err, null, res);
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
    experiment.users().then(function(data){
        writeObjectsToClient(null, data, res);
    }).catch(function(err){
        writeObjectsToClient(err, null, res);
    });
};

module.exports = {
    getUsers: getUsers,
    makeCSV: makeCSV
};
