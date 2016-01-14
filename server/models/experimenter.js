/**
 * The experimenter model, and the CRUD functions
 * @module
 */

var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";

/**
 * Finds an experimenter account in that database.
 * @param {string} username The user name for the account
 * @param {Function} cb Callback function called with (err,
 * user).
 */
module.exports.findExperimenter = function(username, cb){
    MongoClient.connect(url, function(err, db){
        if(err) return cb(err);
        var coll = db.collection("experimenters");
        coll.findOne({username: username}, cb);
    });
};

/**
 * Inserts an experimenter account in that database.
 * @param {string} username The user name for the account
 * @param {string} ha1 The constructed HA1 for the account
 * @param {Function} cb Callback function called with (err).
 * err is "conflict" if entry already exists.
 */
module.exports.insertExperimenter = function(username, ha1, cb){
    MongoClient.connect(url, function(err, db){
        if(err) return cb(err);
        var coll = db.collection("experimenters");
        coll.count({username: username}, function(err, n){
            if(err) return cb(err);
            if(n > 0) return cb("conflict");
            coll.insertOne({username: username,
                            password: {ha1: ha1},
                            created: new Date()},
                           function(err, res){
                               if(err) return cb(err);
                               else return cb();
                           });
        });
    });
};

/**
 * Updates an experimenter account in that database.
 * @param {string} username The user name for the account
 * @param {string} ha1 The constructed HA1 for the account
 * @param {Function} cb Callback function called with (err).
 * err is "not found" if entry is not found
 */
module.exports.updateExperimenter = function(username, ha1, cb){
    MongoClient.connect(url, function(err, db){
        if(err) return cb(err);
        var coll = db.collection("experimenters");
        coll.count({username: username}, function(err, n){
            if(err) return cb(err);
            if(n === 0) return cb("not found");
            coll.update({username: username},
                        {username: username,
                         password: {ha1: ha1},
                         created: new Date()},
                        function(err, res){
                            if(err) return cb(err);
                            else return cb();
                        });
        });
    });
    
};

/**
 * Deletes an experimenter account in that database.
 * @param {string} username The user name for the account
 * @param {Function} cb Callback function called with (err).
 * err is "not found" if entry is not found
 */
module.exports.deleteExperimenter = function(username, cb){
    MongoClient.connect(url, function(err, db){
        if(err) return cb(err);
        var coll = db.collection("experimenters");
        coll.count({username: username}, function(err, n){
            if(err) return cb(err);
            if(n === 0) return cb("not found");
            coll.deleteOne({username: username},
                        function(err, res){
                            if(err) return cb(err);
                            else return cb();
                        });
        });
    });
};
