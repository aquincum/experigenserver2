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
    model.findExperimenter(req.query.experimenter, function(err, doc){
        if(err){
            res.end(err);
        }
        else{
            if(!doc){
                return res.status(404).end("none");
            }
            res.status(200).end(doc.username);
        }
    });
};

module.exports.postExperimenter = function(req, res){
    if(!req.query.experimenter || !req.query.ha1){
        res.status(400);
        return res.end("Wrong request!");
    }
    model.insertExperimenter(req.query.experimenter, req.query.ha1, function(err){
        if(err){
            if(err=="conflict"){
                res.status(409);
            }
            res.end(err);
        }
        else {
            res.status(200).end("done");
        }
    });
};

module.exports.putExperimenter = function(req, res){
    if(req.user.username !== req.query.experimenter){
        return res.status(403).end("not authorized");
    }
    model.updateExperimenter(req.query.experimenter, req.query.ha1, function(err){
        if(err){
            if(err=="not found"){
                res.status(404);
            }
            res.end(err);
        }
        else {
            res.status(200).end("done");
        }
    });
};

module.exports.deleteExperimenter =  function(req, res){
    if(!req.user || (req.user.username !== req.query.experimenter)){
        return res.status(403).end("not authorized");
    }
    model.deleteExperimenter(req.query.experimenter, function(err){
        if(err){
            if(err=="not found"){
                res.status(404);
            }
            res.end(err);
        }
        else {
            res.status(200).end("done");
        }
    });
};
