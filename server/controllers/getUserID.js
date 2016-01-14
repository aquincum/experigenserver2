/** Handles the `getuserid` query
 * @module */

var db = require("../db");

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

module.exports = getUserID;
