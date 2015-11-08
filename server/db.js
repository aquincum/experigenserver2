/** This module contains functions to interact with the database
 * (MongoDB for now).
 * @module db  
 */

var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";
var util = require("./util");

/**
 * Returns the numeric userFileName for the given subject/session to
 * the callback. It checks out whether the colleciton exists at all,
 * and returns 1 if it does not, or returns the lowest UFN otherwise.
 * If runs into an error, returns 0.
 * @param {string} htmlSource The HTML source from the client.
 * @param {string} experimentName The experiment name from the client.
 * @param {Function} cb The callback function that takes the result as
 * an argument. Result is 0 if error, the UFN otherwise.
 */
module.exports.getUserFileName = function(htmlSource, experimentName, cb){
    var cleanHTMLS = util.cleanURL(htmlSource);
    MongoClient.connect(url, function(err, db){
	var collname = util.createCollectionName(cleanHTMLS, experimentName);
	var coll = db.collection(collname);
	coll.aggregate([
	    { $match: {experimentName: experimentName} },
	    { $project: {userFileName: 1} },
	    { $group: {
		_id: null,
		highest: {$max: "$userFileName"}
	    }}
	], function(err, result){
	    if(err){
		cb(0);
	    }
	    else if (result.length === 0){
		cb(1);
	    }
	    else {
		cb(result[0].highest+1);
	    }
	});
    });
};


/**
 * Returns the database object to play with if necessary.
 * @param {Function} cb A callback in the MongoDB (err,db) fashion.
 */
module.exports.getDB = function(cb){
    MongoClient.connect(url, {}, function(err, db){
	cb(err, db);
	db.close();
    });
};
