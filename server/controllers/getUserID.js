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
        res.status(400).jsonp('0').end();
    }
    else {
        var experiment = new Experiment(html, expname);
        experiment.getUserFileName().then(function (ufn){
            res.status(200).jsonp(ufn.toString()).end();
        }).catch(function(err){
            res.status(500).jsonp('-1').end();
        });
    }
};

module.exports = getUserID;
