/** Handles the getDestinations query
 * @module */

var Experiment = require("../models/experiment");


/**
 * Returns the destination files for a given experiment.
 * Returns JSON.
 */
var getDestinations = function(req, res){
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
    experiment.getDestinations().then(function(dests){
        res.status(200).json(dests).end();
    }).catch(function(err){
        if(err.message == Experiment.NOSUCHEXPERIMENT){
            res.status(404).end(err.message);
        }
        else {
            res.status(500).end(err.toString());
        }
    });
};

module.exports = getDestinations;
