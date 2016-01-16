/** Handles authentication related queries
 * @module  */

var model = require("../models/experimenter");
var Experiment = require("../models/experiment");
var Registration = require("../models/registration");

module.exports.me = function(req,res){
    if(req.user){
        res.end(req.user.username);
    }
    else{
        res.end("none");
    }
};

module.exports.getExperimenter = function(req, res){
    model.findExperimenter(req.query.experimenter).then(function(doc){
        if(!doc){
            res.status(404).end("none");
        }
        else {
            res.status(200).end(doc.username);
        }
    }).catch(function(err){
        res.status(500).end(err);
    });
};

module.exports.postExperimenter = function(req, res){
    if(!req.query.experimenter || !req.query.ha1){
        res.status(400);
        return res.end("Wrong request!");
    }
    model.insertExperimenter(req.query.experimenter, req.query.ha1)
        .then(function(){
            res.status(200).end("done");
        }).catch(function(err){
            if(err.message=="conflict"){
                res.status(409).end(err.message);
            }
            else{
                res.status(500).end(err.toString());
            }
        });
};

module.exports.putExperimenter = function(req, res){
    if(req.user.username !== req.query.experimenter){
        return res.status(403).end("not authorized");
    }
    model.updateExperimenter(req.query.experimenter, req.query.ha1)
        .then(function(){
            res.status(200).end("done");
        }).catch(function(err){
            if(err=="not found"){
                res.status(404);
            }
            else{
                res.status(500);
            }
            res.end(err);
        });
};

module.exports.deleteExperimenter =  function(req, res){
    if(!req.user || (req.user.username !== req.query.experimenter)){
        return res.status(403).end("not authorized");
    }
    model.deleteExperimenter(req.query.experimenter)
        .then(function(){
            res.status(200).end("done");
        }).catch(function(err){
            if(err=="not found"){
                res.status(404);
            }
            else {
                res.status(500);
            }
            res.end(err);
        });
};

module.exports.checkRegistration = function(toserve, req, res){
    var sourceUrl = req.query.sourceurl,
        experimentName = req.query.experimentName,
        user = req.user ? req.user.username : "";

    if(!sourceUrl || !experimentName){
        return res.status(400).end("Bad request");
    }

    var experiment = new Experiment(sourceUrl, experimentName);
    Registration.find(experiment)
        .then(function(reg){
            /* If the experiment is not registered, we will let the experimenter
             * get the data. */
            if(!reg || reg.experimenter === user){ 
                toserve(req, res);
            }
            else { // reg.experimenter !== user
                res.status(403).end("You are not authorized to receive this data, as the experiment is registered to a different experimenter.");
            }
        }).catch(function(err){
            res.status(500).end(err.toString());
        });
};

