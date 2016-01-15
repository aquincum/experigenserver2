/**
 * The experimenter model, and the CRUD functions
 * @module
 */

var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";

/**
 * Finds an experimenter account in that database.
 * @param {string} username The user name for the account
 * @returns {Promise<user>} The user account
 */
module.exports.findExperimenter = function(username){
    return MongoClient.connect(url).then(function(db){
        var coll = db.collection("experimenters");
        return coll.findOne({username: username});
    });
};

/**
 * Inserts an experimenter account in that database.
 * @param {string} username The user name for the account
 * @param {string} ha1 The constructed HA1 for the account
 * @returns {Promise}  Promise rejected with "conflict" if
 *  entry already exists.
 */
module.exports.insertExperimenter = function(username, ha1){
    var coll;
    return MongoClient.connect(url)
        .then(function(db){
            coll = db.collection("experimenters");
            return coll.count({username: username});
        })
        .then (function(n){
            if(n > 0) return Promise.reject("conflict");
            return coll.insertOne({username: username,
                                   password: {ha1: ha1},
                                   created: new Date()});
        });
};

/**
 * Updates an experimenter account in that database.
 * @param {string} username The user name for the account
 * @param {string} ha1 The constructed HA1 for the account
 * @returns {Promise} Promise rejected with  "not found" if
 *  entry is not found
 */
module.exports.updateExperimenter = function(username, ha1){
    var coll;
    return MongoClient.connect(url)
        .then(function(db){
            coll = db.collection("experimenters");
            return coll.count({username: username});
        })
        .then(function(err, n){
            if(n === 0) return Promise.reject("not found");
            return coll.update({username: username},
                               {username: username,
                                password: {ha1: ha1},
                                created: new Date()});
        });
};

/**
 * Deletes an experimenter account in that database.
 * @param {string} username The user name for the account
 * @returns {Promise} Promise rejected with "not found" 
 * if entry is not found
 */
module.exports.deleteExperimenter = function(username){
    var coll;
    return MongoClient.connect(url)
        .then(function(db){
            coll = db.collection("experimenters");
            return coll.count({username: username});
        })
        .then(function(n){
            if(n === 0) return Promise.reject("not found");
            return coll.deleteOne({username: username});
        });
};
