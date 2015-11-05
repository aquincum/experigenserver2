var MongoClient = require("mongodb").MongoClient,
    url = "mongodb://localhost/experigen";
var util = require("./util");


module.exports.getUserFileName = function(htmlSource, experimentName, cb){
    var cleanHTMLS = util.cleanURL(htmlSource);
    MongoClient.connect(url, function(err, db){
	var collname = util.createCollectionName(htmlSource, experimentName);
	var coll = db.collection(collname);
	coll.aggregate([
	    { $match: {experimentName: experimentName} },
	    { $project: {userFileName: 1} },
	    { $group: {
		_id: null,
		highest: {$max: "$userFileName"}
	    }}
	], function(err, result){
	    if(err || result.length === 0){
		cb(0);
	    }
	    else {
		cb(result[0].highest+1);
	    }
	});
    });
};

module.exports.getDB = function(cb){
    MongoClient.connect(url, {}, function(err, db){
	cb(err, db);
	db.close();
    });
};
