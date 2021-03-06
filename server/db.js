/*eslint-env node*/

/** This module contains functions to interact with the database
 * (MongoDB for now).
 * @module 
 */

var MongoClient = require("mongodb").MongoClient;
var util = require("./util");

// Inner db connection
var _db = null;

/**
 * Figures out the URL of the database: if we're on Amazon EBS,
 * we're connecting to the linked mongo, otherwise we're running
 * on localhost. And if we have the EXPERIGEN_MONGODB_ADDR environment
 * vairable set, use that; with EXPERIGEN_MONGODB_PORT or 27017 
 * by default
 * @returns String
 */
var getURL = function(){
    var addr = process.env.EXPERIGEN_MONGODB_ADDR || process.env.MONGODB_PORT_27017_TCP_ADDR || "localhost",
        port = process.env.EXPERIGEN_MONGODB_PORT || process.env.MONGODB_PORT_27017_TCP_PORT || 27017,
        dbname = "experigen";
    return "mongodb://" + addr + ":" + port + "/" + dbname;
};

// memoize this
var url = getURL();
console.log("MongoDB database at " + url);

/**
 * Returns the database object to play with if necessary.
 * @returns {Promise<database>}
 */
module.exports.getDB = function(){
    if(!_db){
        return MongoClient.connect(url).then(function(db){
            console.log("Connected to MongoDB database");
            db.on("close", function(){
                _db = null;
            });
            _db = db;
            return db;
        }).catch(function(err){
            console.error("Cannot connect to " + url + "!");
            _db = null;
            return Promise.reject("Cannot connect to database");
        });
    }
    else{
        return Promise.resolve(_db);
    }
};

/** Closes the database.it really just closes the DB at the next available moment.
 * Since promisification, it does return the Promise.
 * @retruns {Promise}
 */
module.exports.closeDB = function(){
    if(_db){
        var rv = _db.close();
        _db = null;
        return rv;
    }
    else{
        return Promise.resolve(null);
    }
};

