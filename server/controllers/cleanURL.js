var Experiment = require("../models/experiment.js");

module.exports = function(req, res){
    var sourceURL = req.query.sourceurl;
    if(!sourceURL){
        return res.status(400).end("Wrong request!");
    }

    var exp = new Experiment(sourceURL, "");
    var clean = exp.cleanURL();
    res.status(200).end(clean);
};
