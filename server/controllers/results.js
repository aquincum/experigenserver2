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
        res.status(400).end("false\n"); // this is how the cgi died
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
        writeObjectsToClient(err.message, null, res);
    });
};

/**
 * Streams the results as JSON. Has the same query as makeCSV plus an
 * optional parameter: `ndjson`. If `ndjson` is specified and is not set
 * to 0 or false, the result will be in ndJSON (newline delimited), otherwise the
 * result will be proper JSON.
 */
var streamResults = function(req, res){
    if(!req.query){
        return res.status(400).json({error: "No query specified"}).end();
    }
    var experimentName = req.query.experimentName,
        sourceurl = req.query.sourceurl,
        file = req.query.file,
        ndjson = req.query.ndjson;
    if (!experimentName || !sourceurl){
        return res.status(400).json({error: "Incomplete query"}).end();
    }
    if(!file){
        file = "default.csv";
    }
    if(!ndjson || ndjson === "false" || ndjson === "0"){
        ndjson = false;
    }
    var experiment = new Experiment(sourceurl, experimentName);
    experiment.getAllData(file, true).then(function(stream){
        var first = true;
        res.writeHead(200, {
            "Content-Type": "application-json"
        });
        if(!ndjson) {
            res.write("[");
        }
        //stream.pipe(res);
        stream.on("data", function(chunk){
            if(!first && !ndjson){
                res.write(",")
            }
            res.write(JSON.stringify(chunk));
            first = false;
        })
        stream.on("end", function(){
            if(!ndjson) {
                res.write("]");
            }
            res.end();
        });
    });
};


/**
 * Returns the usercode/number of records table.
 */
var getUsers = function(req, res){
    function fail(){
        res.status(400).end("false\n"); // this is how the cgi died
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
        writeObjectsToClient(err.message, null, res);
    });
};

/** Returns the total n of records */
var count = function(req, res){
    function fail(){
        res.status(400).json({error: "Wrong query", n: 0}).end(); 
    }
    if (!req.query) return fail();
    var experimentName = req.query.experimentName,
        sourceurl = req.query.sourceurl;
    if (!experimentName || !sourceurl){
        return fail();
    }
    var experiment = new Experiment(sourceurl, experimentName);
    experiment.count().then(function(n){
        res.status(200).json({n: n}).end();
    }).catch(function(err){
        res.status(500).json({error: err, n: 0}).end();
    });
    
}

module.exports = {
    getUsers: getUsers,
    makeCSV: makeCSV,
    streamResults: streamResults,
    count: count
};
