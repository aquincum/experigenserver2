/*eslint-env node*/

/** This module contains functions to interact with the database
 * (MongoDB for now).
 * @module 
 */

var MongoClient = require("mongodb").MongoClient;
var util = require("./util");

/**
 * Figures out the URL of the database: if we're on Amazon EBS,
 * we're connecting to the linked mongo, otherwise we're running
 * on localhost.
 * @returns String
 */
var getURL = function(){
    var addr = process.env.MONGODB_PORT_27017_TCP_ADDR,
        port = process.env.MONGODB_PORT_27017_TCP_PORT,
        dbname = "experigen";
    if (addr){ // we're running on Amazon!
        return "mongodb://" + addr + ":" + port + "/" + dbname;
    }
    else {
        return "mongodb://localhost/" + dbname;
    }
};

// memoize this
var url = getURL();
console.log("MongoDB database at " + url);

/**
 * Returns the database object to play with if necessary.
 * @returns {Promise<database>}
 */
module.exports.getDB = function(){
    return MongoClient.connect(url);
};

/** Closes the database.it really just closes the DB at the next available moment.
 * Since promisification, it does return the Promise.
 * @retruns {Promise}
 */
module.exports.closeDB = function(){
    return MongoClient.connect(url, {}).then(function(db){
        return db.close(db);
    });
};

