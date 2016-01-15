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
        res.status(400).end("(\"0\")");
    }
    else {
        var experiment = new Experiment(html, expname);
        experiment.getUserFileName().then(function (ufn){
            res.status(200).end("(\"" + ufn.toString() + "\")");
        }).catch(function(err){
            res.status(500).end('("-1")');
        });
    }
};

module.exports = getUserID;
