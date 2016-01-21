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
 * @property {String} sourceUrl The source URL
 * @property {String} experimentName The experiment name set by the client
 * @property {Boolean} cleaned Whether the cleaning has been done
 * @property {?String} collectionName The collection name to be used in the
 * database 
 */
var Experiment = function(sourceUrl, experimentName){
    this.sourceUrl = sourceUrl;
    this.experimentName = experimentName;
    this.cleaned = false;
    this.collectionName = null;
    return this;
};

/** Return error for query functions if experiment is not found.
 * @static
 * @const 
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
 * @returns {Promise<Collection>}
 */
Experiment.prototype.connectToCollection = function(){
    var that = this;
    if(!this.cleaned){
        this.cleanURL();
    }
    if(!this.collectionName){
        this.createCollectionName();
    }
    return database.getDB().then(function(db){
        var coll = db.collection(that.collectionName);
        return coll;
    });
};



/**
 * Returns an array of destination file names. Returns default.csv for
 * empty destination files. Also returns {@link module:server/models/experiment~Experiment.NOSUCHEXPERIMENT}
 *  for no experiment.
 * @param {Promise<String[]>} A promise resolved with an Array of Strings.
 */
Experiment.prototype.getDestinations = function(){
    var that = this;
    return this.connectToCollection()
        .then(function(coll){
            return coll.aggregate([
                { $match: {experimentName: that.experimentName}},
                { $project: {destination: 1}},
                { $group: {_id: "$destination", records: {$sum: 1}}}
            ]).toArray();
        }).then(function(dests){
            var retval = [];
            if (dests.length === 0){
                throw new Error(NOSUCHEXPERIMENT);
            }
            else {
                dests.forEach(function(d){
                    if (d._id === null){
                        d._id = "default.csv";
                    }
                    retval.push(d._id);
                });
                return retval;
            }
        });
};

/**
 * Returns a map of usercode/number combination, as summarized from the
 * database. The return is a promise with an object array.
 * @returns {Promise<Object[]>} Promise with an array of users.
 * Each object having a `userCode` and a `records`
 * field. Rejects with {@link module:server/models/experiment~Experiment.NOSUCHEXPERIMENT}
 * if no such experiment.
 */
Experiment.prototype.users = function(){
    var that = this;
    return this.connectToCollection()
        .then(function(coll){
            return coll.aggregate([
                { $match: {experimentName: that.experimentName}},
                { $project: {userCode: 1}},
                { $group: {_id: "$userCode", records: {$sum: 1}}}
            ]).toArray();
        }).then(function(users){
            if (users.length === 0){
                throw new Error(NOSUCHEXPERIMENT);
            }
            else {
                users.forEach(function(u){
                    u.userCode = u._id;
                    delete u._id;
                });
                return users;
            }
        });
};


/**
 * This will probably not be exposed in the API, but I want to be able
 * to have all data removed. Think twice before using.
 * @returns {Promise} A promise forwarded from mongoDB.
 */
Experiment.prototype.removeExperiment = function(){
    var that = this;
    return this.connectToCollection().then(function(coll){
            return coll.deleteMany({experimentName: that.experimentName});
    });
};


/**
 * This function gets all of the data from the experiment denoted by
 * the source URL and the experiment name and returns it to the 
 * promise. This will be used initially in makecsv, but later on we
 * should switch to a more stream-based way of working.
 * @param {string} [destination="default.csv"] The destination CSV the data was sent.
 * Conforming to the old CSV style, "default.csv" is the default, so
 * data for which no destination was specified goes there.
 * @param {Promise<Object[]>} The results. It should return an error
 *  if no such experiment is there in the db.
 */
Experiment.prototype.getAllData = function(destination){
    var that = this;
    if(!destination){
        destination = "default.csv";
    }
    if(destination == "default.csv"){
        destination = {$exists: false};
    }
    return this.connectToCollection()
        .then(function(coll){
            return coll.find({experimentName: that.experimentName,
                              destination:    destination},
                             { _id: 0 }
                            );
        }).then(function(cursor){
            return cursor.toArray();
        }).then(function(results){
            if(results.length === 0){
                throw new Error(NOSUCHEXPERIMENT);
            }
            else {
                return results;
            }
        });
};



/**
 * Writes data to the server (async). We can take it for granted that
 * `query` has all the necessary fields.
 * @param {Object} query The whole web query coming from `req`
 * @param {number} [errcnt=3] Maximum times of failure to give up write
 * @returns {Promise<Boolean>} A promise resolved with a boolean,
 * `true` for success and `false` with error.
 */
Experiment.prototype.write = function(query, errcnt){
    // I don't see the reason to clean up the fields as in server 1
    // except for the sourceURL and maybe UFN
    if(!errcnt) errcnt = 3;
    //query.sourceurl = util.cleanURL(query.sourceurl);
    query.userFileName = parseInt(query.userFileName, 10);

    return this.connectToCollection()
        .then(function(coll){
            return coll.insert(query);
        }).then(function(_){
            return true;
        }).catch(function(err){
            if(errcnt){
                return this.write(query, errcnt-1);
            }
            else {
                util.Logger.log("DB connection error!");
                return false;
            }
        });
};

/**
 * Returns the numeric userFileName for the given subject/session in
 * a promise. It checks out whether the collection exists at all,
 * and returns 1 if it does not, or returns the lowest UFN otherwise.
 * If runs into an error, returns 0.
 * @returns {Promise<Number>} A promise with the UFN.
 */
Experiment.prototype.getUserFileName = function(){
    var that = this;
    return this.connectToCollection()
        .then (function(coll){
            return coll.aggregate([
                { $match: {experimentName: that.experimentName} },
                { $project: {userFileName: 1} },
                { $group: {
                    _id: null,
                highest: {$max: "$userFileName"}
                }}
            ]).toArray();
        }).then(function(result){
            console.log(result);
            if (result.length === 0){
                return 1;
            }
            else {
                return result[0].highest+1;
            }
        });
};

module.exports = Experiment;
