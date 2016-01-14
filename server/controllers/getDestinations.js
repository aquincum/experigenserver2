/** Handles the getDestinations query
 * @module */

var Experiment = require("../models/experiment");


/**
 * Returns the destination files for a given experiment.
 * Returns JSON.
 */
var getDestinations = function(req, res){
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
    experiment.getDestinations(function(err, dests){
        if(err !== null){
            res.end(err);
        }
        else {
            res.end(JSON.stringify(dests));
        }
    });
};

module.exports = getDestinations;
