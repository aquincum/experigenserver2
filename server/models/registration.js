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
 * @returns {Promise}
 */
Registration.prototype.connect = function(){
    this.experiment.cleanURL();
    this.experiment.createCollectionName();
    return database.getDB().then(function(db){
        var coll = db.collection("registration");
        return coll;
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
 * Registers the registration (my English fails). Will fire the error if
 * the experiment is already registered or if there is data in the experiment
 * already.
 * @returns {Promise<Boolean>} A promise that will reject if unsuccessful with a human-
 * readable error. Otherwise returns `true`.
 */
Registration.prototype.register = function(){
    var that = this, coll;
    return this.connect()
        .then(function(_coll){
            coll = _coll;
            return coll.count(
                {
                    "experiment.experimentName": that.experiment.experimentName,
                    "experiment.sourceUrl": that.experiment.sourceUrl
                });
        }).then(function(n){
            if(n > 0){
                throw new Error("Experiment already registered!");
            }
            return that.experiment.getUserFileName();
        }).then(function(ufn){
            if(ufn === 1){
                // good!
                return coll.insert(that.mongoRepresentation());
            }
            else {
                throw new Error("Experiment already has data!");
            }
        }).then(function(){
            return true;
        });
};

/**
 * Removes registration.
 * @returns <Promise>
 */
Registration.prototype.remove = function(){
    var that = this;
    return this.connect().then(function(coll){
        return coll.remove(that.mongoRepresentation());
    });
};

/**
 * Checks whether an experiment is registered. If it is, it returns 
 * the registration details, if it is not, it returns `null`
 * @param {module:server/models/experiment~Experiment} experiment The experiment to find
 * @returns {Promise<Registration>} A promise resolved with the found registration or
 * with `null` if no registration is found.
 * @static
 */
Registration.find = function(experiment){
    var reg = new Registration("", experiment);
    return reg.connect()
        .then(function(coll){
            return coll.findOne({
                "experiment.experimentName": reg.experiment.experimentName,
                "experiment.sourceUrl": reg.experiment.sourceUrl
            });
        }).then(function(doc){
            if (!doc){
                return null;
            }
            else {
                reg.experiment = doc.experiment;
                reg.experimenter = doc.experimenter;
                return reg;
            }
        });
};


module.exports = Registration;
