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
 * @callback registerCallback
 * @param {?String} err An error indicating what went wrong. Could be forwarded
 * to the end user,
 */

/**
 * A callback function which returns the found registration or null
 * @callback findCallback
 * @param {?String} err A possible error
 * @param {?module:server/models/registration~Registration} reg A registration or
 * `null` found in the database.
 */



/**
 * Registers the registration (my English fails). Will fire the error if
 * the experiment is already registered or if there is data in the experiment
 * already.
 * @param {module:server/models/registration~registerCallback} cb The callback function which indicates
 * if the operation was successful.
 */
Registration.prototype.register = function(cb){
    var that = this;
    this.connect(function(err, coll){
        if(err) cb(err);
        coll.count(
            {
                "experiment.experimentName": that.experiment.experimentName,
                "experiment.sourceUrl": that.experiment.sourceUrl
            },
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

/**
 * Checks whether an experiment is registered. If it is, it returns 
 * the registration details, if it is not, it returns `null`
 * @param {module:server/models/experiment~Experiment} experiment The experiment to find
 * @param {module:server/models/registration~findCallback} cb Callback with the registration
 * @static
 */
Registration.find = function(experiment, cb){
    var reg = new Registration("", experiment);
    reg.connect(function(err, coll){
        if(err) return cb(err);
        coll.findOne({
            "experiment.experimentName": reg.experiment.experimentName,
            "experiment.sourceUrl": reg.experiment.sourceUrl
        }, function(err, doc){
            if(err) return cb(err);
            if (!doc){
                cb(null, null);
            }
            else{
                reg.experiment = doc.experiment;
                reg.experimenter = doc.experimenter;
                cb(null, reg);
            }
        });
    });
};


module.exports = Registration;
