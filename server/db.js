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
 * @param {Function} cb A callback in the MongoDB (err,db) fashion.
 */
module.exports.getDB = function(cb){
    MongoClient.connect(url, {}, cb);
};

/** Closes the database. I don't think it needs a callback,
 * it really just closes the DB at the next available moment.
 */
module.exports.closeDB = function(){
    MongoClient.connect(url, {}, function(err, db){
        db.close(db);
    });
};

