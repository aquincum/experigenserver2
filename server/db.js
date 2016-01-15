/*eslint-env node*/

/** This module contains functions to interact with the database
 * (MongoDB for now).
 * @module 
 */

var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";
var util = require("./util");


/**
 * Returns the database object to play with if necessary.
 * @returns {Promise<database>}
 */
module.exports.getDB = function(cb){
    return MongoClient.connect(url);
};

/** Closes the database. I don't think it needs a callback,
 * it really just closes the DB at the next available moment.
 * Since promisification, it does return the Promise though.
 */
module.exports.closeDB = function(){
    return MongoClient.connect(url, {}).then(function(db){
        return db.close(db);
    });
};

