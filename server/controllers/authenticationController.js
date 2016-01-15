/** Handles authentication related queries
 * @module  */

var model = require("../models/experimenter");


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
            if(err=="conflict"){
                res.status(409);
            }
            else{
                res.status(500);
            }
            res.end(err);
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
