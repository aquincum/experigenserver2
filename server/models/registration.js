/**
 * This model describes registrations, which is a link
 * between an experiment and an experimenter. An experimenter
 * can register an experiment, if that has no data yet. After
 * this, only the registered experimenter has access to this
 * experiment.
 * @module
 */

var database = require("../db");
var Experiment = require("./experiment");

/**
 * The constructor
 * @param {String} experimenter Experimenter name
 * @param {module:server/models/experiment~Experiment} experiment The experiment object.
 * @constructor
 */
var Registration = function (experimenter, experiment){
    this.experimenter = experimenter;
    this.experiment = experiment;
    return this;
};


/**
 * Connects to the database
 */
Registration.prototype.connect = function(cb){
    this.experiment.cleanURL();
    this.experiment.createCollectionName();
    database.getDB(function(err, db){
        var coll = db.collection("registration");
        cb(err, coll);
    });
};

/**
 * The mongodb representation of this registration
 */
Registration.prototype.mongoRepresentation = function(){
    return {
        experiment: this.experiment,
        experimenter: this.experimenter,
    };
};
/**
 * A callback function which indicates whether a register operation was successful.
 * @callback Registration~registerCallback
 * @param {?String} err An error indicating what went wrong. Could be forwarded
 * to the end user,
 */

/**
 * Registers the registration (my English fails). Will fire the error if
 * the experiment is already registered or if there is data in the experiment
 * already.
 * @param {Registration~registerCallback} cb The callback function which indicates
 * if the operation was successful.
 */
Registration.prototype.register = function(cb){
    var that = this;
    this.connect(function(err, coll){
        if(err) cb(err);
        coll.count(
            {experiment: that.experiment.collectionName},
            function(err, n){
                if(err) return cb(err);
                if(n > 0){
                    return cb("Experiment already registered!");
                }
                that.experiment.users(function(err, u){
                    if(err == Experiment.NOSUCHEXPERIMENT){
                        // good!
                        coll.insert(that.mongoRepresentation(),
                                    function(err, result){
                                        if(err) cb(err);
                                        else cb(null, true); // we're ripe to Promisify
                                    });
                    }
                    else {
                        if(err) return cb(err);
                        cb("Experiment already has data!");
                    }
                });
            });
    });
};

/**
 * Removes registration.
 * @param {Function} cb Callback
 */
Registration.prototype.remove = function(cb){
    var that = this;
    this.connect(function(err, coll){
        if(err) return cb(err);
        coll.remove(that.mongoRepresentation(), cb);
    });
};

module.exports = Registration;
