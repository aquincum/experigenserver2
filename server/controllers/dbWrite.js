/** Handles the DB write query
 * @module */

var Experiment = require("../models/experiment");

/**
 * Writes data coming from the experiment into the database. Everything goes
 * to a collection with the hashed name. Destination (eg. demographics.csv,
 * etc.) is just a field for now, it'll be handled on download -- this is how
 * Experigen server 1 did it too.
 */
var dbWrite = function(req, res){
    function fail(stat){
        if(!stat){
            stat = 500;
        }
        res.status(stat).jsonp("false").end(); // this is how the cgi died
    }
    if (!req.query) return fail(400);
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
    if(query.callback){
        delete query.callback; // do not save this
    }
    if(query._){
        delete query._; // do not save this either (hopefully time will be saved well)
    }
    query.time = (new Date()).getTime();
    var experiment = new Experiment(sourceurl, experimentName);
    // let's pass on everything now to the db, I'll clean up there.
    experiment.write(query).then(function (success){
        if(success){
            res.status(200).jsonp("true").end();
        }
        else {
            fail();
        }
    }).catch(fail);
};

module.exports = dbWrite;
