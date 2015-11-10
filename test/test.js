var assert = require("assert");
var routing = require("../server/routing");
var db = require("../server/db");
var util = require("../server/util");

var tempsourceurl = "http://localhost/testing/now";
var tempexperimentname = "000test000";

// let's do this
/* first */
describe("Routing", function(){
    it("Should route to functions to responses", function(){
	var mockServer = {
	    get: function(path, func){
		assert.equal(typeof func, "function");
	    }
	};
	routing.route(mockServer);
    });
    it("Should give me back the version string", function(){
	routing.routes["/version"]({}, {
	    end: function(data){
		assert.equal(data, require("../package.json").version);
	    }
	});
    });
});

describe("URL cleaning", function(){
    it("should be okay with simple strings", function(){
	var teststrings = ["almaKORTE123...ahha",
			  "asdasdasd!asd",
			   "()mhm'"];
	teststrings.map(function(ts){
	    assert.equal(util.cleanURL(ts), ts);
	});
    });
    it("should take off http://", function(){
	assert.equal(util.cleanURL("http://my.site"), "my.site");
    });
    it("should chop off /", function(){
	assert.equal(util.cleanURL("http://my.site/"), "my.site");
    });
    it("should be replacing : and / with dots", function(){
	assert.equal(util.cleanURL("http://my.site/my/path/"), "my.site.my.path");
    });
    it("should be removing tildes", function(){
	assert.equal(util.cleanURL("http://my.site/~home/"), "my.site.home");
    });
    it("should not take off https://", function(){
	assert.equal(util.cleanURL("https://my.site/"), "https...my.site");
    });
});

describe("Hashing", function(){
    var teststrings = ["asdASD???ammmpffffgh25",
		       "asdASD???ammmpffffgh26"];
    it("Should return the same for the same", function(){
	assert.equal(util.hash(teststrings[0]), util.hash(teststrings[0]));
    });
    it("Should return different for different", function(){
	assert.notEqual(util.hash(teststrings[0]), util.hash(teststrings[1]));
    });
    it("Should be shorter than 14 bytes", function(){
	assert.equal(util.hash(teststrings[0]).length < 14, true);
	assert.equal(util.hash(teststrings[1]).length < 14, true);
	assert.equal(util.hash(teststrings[0]+teststrings[1]).length < 14, true);
    });
    it("Should create unique collection names", function(){
	var cn = util.createCollectionName(teststrings[0], teststrings[1]);
	assert.equal(cn, util.createCollectionName(teststrings[0], teststrings[1]));
	assert.notEqual(cn, util.createCollectionName(teststrings[0]+"q", teststrings[1]));
	assert.equal(cn.slice(0,3), "exp");
    });
});

describe("Database", function(){
    it("Should connect", function(){
	db.getDB(function(err, db){
	    assert.equal(err, null);
	    assert.ok(db);
	});
    });
    it("Should give me 1 as userfilename in a new experiment", function(){
	db.getUserFileName(tempsourceurl, tempexperimentname, function(result){
	    assert.equal(result, 1);
	});
    });
    it("Should be able to write a lot of data", function(){
	var q = {sourceurl: tempsourceurl,
		 experimentName: tempexperimentname,
		 userFileName: 1,
		 userCode: "Tester",
		 response: "good",
		 i: 0};
	var writing = new Promise(function(resolve, reject){
	    db.write(q, resolve);
	});
	for(var i = 1; i < 1000; i++){
	    writing = writing.then(new Promise(function(resolve, reject){
		var inserted = q;
		inserted.i = i;
		db.write(inserted, resolve);
	    }));
	}
	writing.then(function(d){
	    assert.equal(d, true);
	});
	writing.catch(function(){
	    assert.equal(true, false);
	});
    });
    it("Should be able to give me back all the data in an Array", function(){
	db.getAllData(tempsourceurl, tempexperimentname, function(err, results){
	    assume.equal(results.length, 1000);
	    assume.equal(results[432].i, 432);
	});
    });
    it("Should be able to remove an experiment", function(){
	db.removeExperiment(tempsourceurl, tempexperimentname, function(err, res){
	    assert.equal(err, null);
	    assert.equal(res.results.ok, 1);
	    db.getAllData(tempsourceurl, tempexperimentname, function(err, results){
		assume.equal(err, db.NOSUCHEXPERIMENT);
	    });
	});
    });
});

describe("getuserid", function(){
    it("Should give back 0 if problems in request", function(){
	routing.routes["/getuserid"]({query: {}}, {
	    end: function(data){
		assert.equal(data, '("0")');
	    }
	});
    });
    it("Should give back 1 if new experiment", function(){
	routing.routes["/getuserid"](
	{ query: {
	    sourceurl: tempsourceurl,
	    experimentName: tempexperimentname
	}}, {
	    end: function(data){
		assert.equal(data, '("1")');
	    }
	});
    });
});

describe("dbwrite", function(){
    it("Should fail if request is faulty", function(){
	routing.routes["/dbwrite"]({query: {}}, {
	    end: function(data){
		assert.equal(data, '("false")');
	    }
	});
	routing.routes["/dbwrite"]({query: {
	    userFileName: 5,
	    userCode: "JANI",
	    sourceurl: "no.where"
	}}, {
	    end: function(data){
		assert.equal(data, '("false")');
	    }
	});
	routing.routes["/dbwrite"]({query: {
	    experimentName: "xxx"
	}}, {
	    end: function(data){
		assert.equal(data, '("false")');
	    }
	});
	routing.routes["/dbwrite"]({}, {
	    end: function(data){
		assert.equal(data, '("false")');
	    }
	});
    });
    it("Should otherwise write to the database", function(){
	var now = new Date();
	var q = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname + "+",
		userCode: "Tester",
		userFileName: 1,
		info: now.getTime()
	    },
	    ip: "127.0.0.1"	    
	};
	routing.routes["/dbwrite"](q, {
	    end: function(data){
		assert.equal(data, "(\"true\")");
		db.getDB(function(err, _db){
		    var collname = util.createCollectionName(q.sourceurl, q.experimentName);
		    _db.collection(collname).findOne({info: now.getTime()}, function(err, doc){
			assume.equal(err, null);
			assume.equal(doc.userCode, "Tester");
			assume.equal(doc.ip, "127.0.0.1");
			_db.collection(collname).remove({info: now.getTime()}, function(err, result){
			    assume.equal(err, null);
			    assume.equal(result.result.n, 1);
			});
		    });
		});
	    }
	});
    });
});
