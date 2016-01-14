var Registration = require("../models/registration");
var Experiment = require("../models/experiment");

/**
 * Deal with the operation
 * @private
 */
var controller = function(method, req, res){
    var experimentName = req.query.experimentName,
        sourceurl = req.query.sourceurl,
        experimenter = req.query.experimenter;
    console.log("CTRL:", method, req.query);
    if (!experimentName || !sourceurl || !experimenter){
        return res.status(400).end("Wrong request");
    }
    if(req.user.username !== experimenter){
        return res.status(403).end("not authorized");
    }
    var experiment = new Experiment(sourceurl, experimentName);
    var registration = new Registration(experimenter, experiment);
    registration[method](function(err, succ){
        if(err){
            res.status(500).end(err);
        }
        else{
            res.status(200).end(succ.toString());
        }
    });
};

/**
 * POST request will have to have three fields: experimenter (for
 * sanity), sourceURL and experimentName.
 */
module.exports.postRegistration = function(req, res){
    console.log("HERE");
    controller("register", req, res);
};

/**
 * DELETE request will have to have three fields: experimenter (for
 * sanity), sourceURL and experimentName.
 */
module.exports.deleteRegistration = function(req, res){
    controller("remove", req, res);
};
