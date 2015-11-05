var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";
var util = require("./util");


module.exports.getUserFileName = function(htmlSource, experimentName, cb){
    var cleanHTMLS = util.cleanURL(htmlSource);
    MongoClient.connect(url, {}, function(err, db){
	
    });
};

module.exports.getDB = function(cb){
    MongoClient.connect(url, {}, function(err, db){
	cb(err, db);
	db.close();
    });
};
