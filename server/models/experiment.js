/**
 * The model for experiments.
 * @module
 */


var database = require("../db");
var hash = require("../util").hash;


/**
 * The model for an experiment.
 * @param {String} souceUrl The (not necessarily yet cleaned) source URL
 * used to identify the experiment.
 * @param {String} experimentName The experiment name set by the client
 * @class
 */
var Experiment = function(sourceUrl, experimentName){
    /** @property {String} sourceUrl The source URL*/
    this.sourceUrl = sourceUrl;
    /** @property {String} experimentName The experiment name set by the client*/
    this.experimentName = experimentName;
    /** @property {Boolean} cleaned Whether the cleaning has been done*/
    this.cleaned = false;
    /** @property {String} collectionName The collection name to be used in the
     * database */
    this.collectionName = null;
    return this;
};

/** Return error for query functions if experiment is not found.
 * @static
 * @const {String}
 * @memberof module:server/models/experiment~Experiment
 */
var NOSUCHEXPERIMENT = Experiment.NOSUCHEXPERIMENT = "No such experiment!";


/**
 * Cleans up the URL based on the old Experigen ways. Might switch it
 * off at some point but it's fine for now.
 * @returns {string} The cleaned URL
 */
Experiment.prototype.cleanURL = function(){
    var res = encodeURIComponent(this.sourceUrl); // URL encoding
    // Sticking to the old ways for now
    var matches = res.match(/^([A-Za-z0-9\.\%\~\!\*\(\)\']+)$/);
    // TODO: test problems?
    res = matches[0];
    res = res.replace(/^http%3A%2F%2F/, ""); // http://
    res = res.replace(/%2F$/, ""); // final /
    res = res.replace(/(%3A|%2F)/g, "."); // http://
    res = res.replace(/(%7E|~)/g, "");
    this.sourceUrl = res;
    this.cleaned = true;
    return res;
};

/**
 * Creates a (hopefully) unique collection name based on the experiment
 * name and the source HTML. Uses the {@link module:server/models/experiment~hash} function inside.
 * @returns {string} The unique identifier.
 */
Experiment.prototype.createCollectionName = function(){
    this.collectionName = "exp" + hash(this.sourceUrl) + hash(this.experimentName);
    return this.collectionName;
};


/**
 * Initializes database connection to the corresponding collection
 * @param {Function} cb A callback function with (err, coll)
 */
Experiment.prototype.connectToCollection = function(cb){
    var that = this;
    if(!this.cleaned){
        this.cleanURL();
    }
    if(!this.collectionName){
        this.createCollectionName();
    }
    database.getDB(function(err, db){
        if(err) return cb(err);
        var coll = db.collection(that.collectionName);
        cb(null, coll);
    });
};



/**
 * Returns an array of destination file names. Returns default.csv for
 * empty destination files. Also returns {@link module:server/models/experiment~Experiment.NOSUCHEXPERIMENT}
 *  for no experiment.
 * @param {Function} cb An (err, dests) style callback, where dests
 * is an Array of Strings.
 */
Experiment.prototype.getDestinations = function(cb){
    var that = this;
    this.connectToCollection(function(err, coll){
        coll.aggregate([
            { $match: {experimentName: that.experimentName}},
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
 * @param {Function} cb An (err, users) style callback, where users is
 * an [{Object}] with each Object having a `userCode` and a `records`
 * field. Returns err with error, {@link module:server/models/experiment~Experiment.NOSUCHEXPERIMENT}
 * if no such experiment, otherwise `err==null`;
 */
Experiment.prototype.users = function(cb){
    var that = this;
    this.connectToCollection(function(err, coll){
        coll.aggregate([
            { $match: {experimentName: that.experimentName}},
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
 * @param {Function} cb An (err, results) style callback forwarded from
 * mongodb directly
 */
Experiment.prototype.removeExperiment = function(cb){
    var that = this;
    this.connectToCollection(function(err, coll){
        coll.deleteMany({experimentName: that.experimentName}, function(){
            cb.apply(null, arguments);
        });
    });
};


/**
 * This function gets all of the data from the experiment denoted by
 * the source URL and the experiment name and returns it to the 
 * callback. This will be used initially in makecsv, but later on we
 * should switch to a more stream-based way of working.
 * @param {string} [destination="default.csv"] The destination CSV the data was sent.
 * Conforming to the old CSV style, "default.csv" is the default, so
 * data for which no destination was specified goes there.
 * @param {Function} cb An (err, results) style callback which is
 * given the results. It should return an error if no such experiment
 * is there in the db.
 */
Experiment.prototype.getAllData = function(destination, cb){
    var that = this;
    if(typeof destination == "function" && !cb){
        cb = destination;
        destination = "default.csv";
    }
    if(destination == "default.csv"){
        destination = {$exists: false};
    }
    this.connectToCollection(function(err, coll){
        if(err) {
            return cb(err);
        }
        coll.find({experimentName: that.experimentName,
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
 * @param {number} [errcnt=3] Maximum times of failure to give up write
 */
Experiment.prototype.write = function(query, cb, errcnt){
    // I don't see the reason to clean up the fields as in server 1
    // except for the sourceURL and maybe UFN
    if(!errcnt) errcnt = 3;
    //query.sourceurl = util.cleanURL(query.sourceurl);
    query.userFileName = parseInt(query.userFileName, 10);

    this.connectToCollection(function(err, coll){
        if(err){
            if(err && errcnt){
                return this.write(query, cb, errcnt-1);
            }
            else if (err){
                util.Logger.log("DB connection error!");
                return cb(false);
            }
        }
        else{
            // push it up
            coll.insert(query, {} , function(err, result){
                if(err && errcnt){
                    return this.write(query, cb, errcnt-1);
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
 * @param {Function} cb The callback function that takes the result as
 * an argument. Result is 0 if error, the UFN otherwise.
 */
Experiment.prototype.getUserFileName = function(cb){
    var that = this;
    this.connectToCollection(function(err, coll){
        coll.aggregate([
            { $match: {experimentName: that.experimentName} },
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

module.exports = Experiment;
