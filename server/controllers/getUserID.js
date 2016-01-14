/** Handles the `getuserid` query
 * @module */

var Experiment = require("../models/experiment");

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
        var experiment = new Experiment(html, expname);
        experiment.getUserFileName(function (ufn){
            res.end("(\"" + ufn.toString() + "\")");
        });
    }
};

module.exports = getUserID;
