/*eslint-env node*/

/** This module contains functions to interact with the database
 * (MongoDB for now).
 * @module db  
 */

var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";
var util = require("./util");


/** Return error for query functions if experiment is not found.*/
var NOSUCHEXPERIMENT = module.exports.NOSUCHEXPERIMENT = "No such experiment!";


/**
 * Returns an array of destination file names. Returns default.csv for
 * empty destination files. Also returns db.NOSUCHEXPERIMENT for no
 * experiment.
 * @param {string} sourceurl The source URL
 * @param {string} experimentName The experiment name
 * @param {Function} cb An (err, dests) style callback, where dests
 * is an Array of Strings.
 */
module.exports.getDestinations = function(sourceurl, experimentName, cb){
    var cleanURL = util.cleanURL(sourceurl),
        collname = util.createCollectionName(cleanURL, experimentName);
    MongoClient.connect(url, function(err, db){
        var coll = db.collection(collname);
        coll.aggregate([
            { $match: {experimentName: experimentName}},
            { $project: {destination: 1}},
            { $group: {_id: "$destination", records: {$sum: 1}}}
        ], function(err, dests){
            var retval = [];
            if(err){
                cb(err);
            }
            else if (dests.length === 0){
                cb(NOSUCHEXPERIMENT);
            }
            else {
                dests.forEach(function(d){
                    if (d._id === null){
                        d._id = "default.csv";
                    }
                    retval.push(d._id);
                });
                cb(null,retval);
            }
        });
    });
};


/**
 * Returns a map of usercode/number combination, as summarized from the
 * database. The return to the callback is an object array.
 * @param {string} sourceurl The source URL
 * @param {string} experimentName The experiment name
 * @param {Function} cb An (err, users) style callback, where users is
 * an [{Object}] with each Object having a `userCode` and a `records`
 * field. Returns err with error, {@link module:db~NOSUCHEXPERIMENT}
 * if no such experiment, otherwise err==null;
 */
module.exports.users = function(sourceurl, experimentName, cb){
    var cleanURL = util.cleanURL(sourceurl),
        collname = util.createCollectionName(cleanURL, experimentName);
    MongoClient.connect(url, function(err, db){
        var coll = db.collection(collname);
        coll.aggregate([
            { $match: {experimentName: experimentName}},
            { $project: {userCode: 1}},
            { $group: {_id: "$userCode", records: {$sum: 1}}}
        ], function(err, users){
            if(err){
                cb(err);
            }
            else if (users.length === 0){
                cb(NOSUCHEXPERIMENT);
            }
            else {
                users.forEach(function(u){
                    u.userCode = u._id;
                    delete u._id;
                });
                cb(null,users);
            }
        });
    });
};


/**
 * This will probably not be exposed in the API, but I want to be able
 * to have all data removed. Think twice before using.
 * @param {string} sourceurl The source URL
 * @param {string} experimentName The experiment name
 * @param {Function} cb An (err, results) style callback forwarded from
 * mongodb directly
 */
module.exports.removeExperiment = function(sourceurl, experimentName, cb){
    var cleanURL = util.cleanURL(sourceurl),
        collname = util.createCollectionName(cleanURL, experimentName);
    MongoClient.connect(url, function(err, db){
        var coll = db.collection(collname);
        coll.deleteMany({experimentName: experimentName}, function(){
            cb.apply(null, arguments);
        });
    });
};



/**
 * This function gets all of the data from the experiment denoted by
 * the source URL and the experiment name and returns it to the 
 * callback. This will be used initially in makecsv, but later on we
 * should switch to a more stream-based way of working.
 * @param {string} sourceurl The source URL
 * @param {string} experimentName The experiment name
 * @param {string} [destination] The destination CSV the data was sent.
 * Conforming to the old CSV style, "default.csv" is the default, so
 * data for which no destination was specified goes there. Also, it's 
 * optional, so default is "default.csv", right.
 * @param {Function} cb An (err, results) style callback which is
 * given the results. It should return an error if no such experiment
 * is there in the db.
 */
module.exports.getAllData = function(sourceurl, experimentName, destination, cb){
    var cleanURL = util.cleanURL(sourceurl),
        collname = util.createCollectionName(cleanURL, experimentName);
    if(typeof destination == "function" && !cb){
        cb = destination;
        destination = "default.csv";
    }
    if(destination == "default.csv"){
        destination = {$exists: false};
    }
    MongoClient.connect(url, function(err, db){
        if(err) {
            return cb(err);
        }
        var coll = db.collection(collname);
        coll.find({experimentName: experimentName,
                   destination:    destination},
                  { _id: 0 }
                 )
            .toArray(function(err, results){
                if(err){
                    return cb(err);
                }
                if(results.length === 0){
                    cb(NOSUCHEXPERIMENT);
                }
                else {
                    cb(null, results);
                }
            });
    });
};




/**
 * Writes data to the server (async). We can take it for granted that
 * `query` has all the necessary fields.
 * @param {Object} query The whole web query coming from `req`
 * @param {Function} cb Callback. Will be called with a boolean,
 * `true` for success and `false` with error.
 * @param {number} errcnt Maximum times of failure to give up write
 */
module.exports.write = function write(query, cb, errcnt){
    // I don't see the reason to clean up the fields as in server 1
    // except for the sourceURL and maybe UFN
    if(!errcnt) errcnt = 3;
    query.sourceurl = util.cleanURL(query.sourceurl);
    query.userFileName = parseInt(query.userFileName, 10);

    MongoClient.connect(url, function(err, db){
        if(err){
            if(err && errcnt){
                return write(query, cb, errcnt-1);
            }
            else if (err){
                util.Logger.log("DB connection error!");
                return cb(false);
            }
        }
        else{
            var collname = util.createCollectionName(query.sourceurl, query.experimentName);
            var coll = db.collection(collname);
            // push it up
            coll.insert(query, {} , function(err, result){
                if(err && errcnt){
                    return write(query, cb, errcnt-1);
                }
                else if (err){
                    util.Logger.log("Write error!");
                    cb(false);
                }
                else {
                    cb(true);
                }
            });
        }
    });
};


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
    });
};

/** Closes the database. I don't think it needs a callback,
 * it really just closes the DB at the next available moment.
 */
module.exports.closeDB = function(){
    MongoClient.connect(url, {}, function(err, db){
        db.close(db);
    });
};


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
 * @param {string} password The password for the account
 * @param {Function} cb Callback function called with (err).
 * err is "conflict" if entry already exists.
 */
module.exports.insertExperimenter = function(username, password, cb){
    MongoClient.connect(url, function(err, db){
        if(err) return cb(err);
        var coll = db.collection("experimenters");
        coll.count({username: username}, function(err, n){
            if(err) return cb(err);
            if(n > 0) return cb("conflict");
            coll.insertOne({username: username,
                            password: password,
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
 * @param {string} password The password for the account
 * @param {Function} cb Callback function called with (err).
 * err is "not found" if entry is not found
 */
module.exports.updateExperimenter = function(username, password, cb){
    MongoClient.connect(url, function(err, db){
        if(err) return cb(err);
        var coll = db.collection("experimenters");
        coll.count({username: username}, function(err, n){
            if(err) return cb(err);
            if(n === 0) return cb("not found");
            coll.update({username: username},
                        {username: username,
                         password: password,
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
