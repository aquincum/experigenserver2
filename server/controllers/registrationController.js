/**
 * Handles requests about registrations.
 * @module
 */

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
    if (!experimentName || !sourceurl || !experimenter){
        return res.status(400).end("Wrong request");
    }
    if(req.user.username !== experimenter){
        return res.status(403).end("not authorized");
    }
    var experiment = new Experiment(sourceurl, experimentName);
    var registration = new Registration(experimenter, experiment);
    registration[method]().then(function(succ){
        res.status(200).end(succ.toString());
    }).catch(function(err){
        console.log(err.toString());
        res.status(500).end(err.toString());
    });


};

/**
 * POST request will have to have three fields: experimenter (for
 * sanity), sourceURL and experimentName.
 */
module.exports.postRegistration = function(req, res){
    controller("register", req, res);
};

/**
 * DELETE request will have to have three fields: experimenter (for
 * sanity), sourceURL and experimentName.
 */
module.exports.deleteRegistration = function(req, res){
    controller("remove", req, res);
};

/**
 * GET request, will find out whether a registration exists, 
 * based on sourceURL and experimentName.
 */
module.exports.getRegistration = function(req, res){
    var experimentName = req.query.experimentName,
        sourceurl = req.query.sourceurl;
    if (!experimentName || !sourceurl){
        return res.status(400).end("Wrong request");
    }
    var experiment = new Experiment(sourceurl, experimentName);
    Registration.find(experiment).then(function(reg){
        if(!reg){
            res.status(404).end("false");
        }
        else{
            res.status(200).end("true");
        }
    }).catch(function(err){
        res.status(500).end(err);
    });
};

/**
 * GET request, will find all of the experiments of the
 * experimenter, and return them as a JSON array.
 */
module.exports.getAllRegistrations = function(req, res){
    var experimenter = req.query.experimenter,
        user = req.user ? req.user.username : "";
    if (!experimenter){
        return res.status(400).end("Wrong request");
    }
    if(!user || user !== experimenter){
        return res.status(403).end("not authorized");
    }
    Registration.findAll(experimenter).then(function(exps){
        res.status(200).json(exps);
    }).catch(function(err){
        res.status(500).end(err);
    });
};
