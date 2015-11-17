var assert = require("assert");
var routing = require("../server/routing");
var db = require("../server/db");
var util = require("../server/util");
var fs = require("fs");

var NTOWRITE = 100;
var tempsourceurl = "http://localhost/testing/now";
var tempexperimentname = "000test000";
var written = 0;
// let's do this
/* first */
describe("Routing", function(){
    it("Should route to functions to responses", function(done){
	var mockServer = {
	    get: function(path, func){
		assert.equal(typeof func, "function");
	    }
	};
	routing.route(mockServer);
	done();
    });
    it("Should give me back the version string", function(done){
	routing.routes["/version"]({}, {
	    end: function(data){
		assert.equal(data, require("../package.json").version);
		done();
	    }
	});
    });
    it("Shouldn't serve .cgi if not emulating", function(done){
	var mockServer = {
	    get: function(path, func){
		assert.notEqual(path.slice(path.length-4, path.length), ".cgi");
	    }
	};
	routing.route(mockServer, false);
	done();
    });
    it("Should serve .cgi if emulating", function(done){
	var cgis = 0, notcgis = 0;
	var mockServer = {
	    get: function(path, func){
		if(path.slice(path.length-4, path.length) == ".cgi"){
		    cgis += 1;
		}
		else {
		    notcgis += 1;
		}
	    }
	};
	routing.route(mockServer, true);
	assert.equal(cgis > 0, true);
	assert.equal(cgis, notcgis);
	done();
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
    this.timeout(10 * 1000);
    it("Should connect", function(done){
	db.getDB(function(err, db){
	    assert.equal(err, null);
	    assert.ok(db);
	    done();
	});
    });
    it("Should give me 1 as userfilename in a new experiment", function(done){
	db.getUserFileName(tempsourceurl, tempexperimentname + "even.newer", function(result){
	    assert.equal(result, 1);
	    done();
	});
    });
    it("Should be able to write a lot of data", function(done){
	var q = JSON.stringify({sourceurl: tempsourceurl,
				experimentName: tempexperimentname,
				userFileName: 1,
				userCode: "Tester",
				response: "good",
				i: 0});
	var ran = 0;
	function wrapup(){
	    assert.equal(written, NTOWRITE);
	    done();
	}
	function writecb(succ){
	    if(succ) written ++;
	    ran ++;
	    if (ran == NTOWRITE+1) wrapup();
	}
	for(var i = 0; i < NTOWRITE; i++){
	    var inserted = JSON.parse(q);
	    inserted.i = i;
	    if(i%15 === 0) inserted.userCode = "TesterFizzBuzz";
	    db.write(inserted, writecb);
	}
	// let's write one more to a different destination.
	var diffDest = JSON.parse(q);
	diffDest.destination = "different.csv";
	diffDest.fieldOnlyHere = 1;
	diffDest.userCode = "WeirdTester";
	delete diffDest.i;
	db.write(diffDest, function(succ){
	    assert.equal(succ, true);
	    ran++;
	    if (ran == NTOWRITE+1) wrapup();
	});
    });
    it("Should be able to give me back all the data in an Array", function(done){
	db.getAllData(tempsourceurl, tempexperimentname, function(err, results){
	    assert.equal(err, null);
	    assert.equal(results.length, written);
	    //	    assert.equal(results[432].i, 432);
	    assert.equal(results[21].i >= 0, true);
	    assert.equal(results[written-4].response, "good");
	    done();
	});
    });
    it("Should be able to write to a different destination", function(done){
	db.getAllData(tempsourceurl, tempexperimentname, "different.csv", function(err, results){
	    assert.equal(err, null);
	    assert.equal(results.length, 1);
	    assert.equal(results[0].destination, "different.csv");
	    done();
	});
    });
});

describe("getuserid", function(){
    it("Should give back 0 if problems in request", function(done){
	routing.routes["/getuserid"]({query: {}}, {
	    end: function(data){
		assert.equal(data, '("0")');
		done();
	    }
	});
    });
    it("Should give back 1 if new experiment", function(done){
	routing.routes["/getuserid"](
	{ query: {
	    sourceurl: tempsourceurl,
	    experimentName: tempexperimentname+"givback1"
	}}, {
	    end: function(data){
		assert.equal(data, '("1")');
		done();
	    }
	});
    });
    it("Should give back 2 after 1 user", function(done){
	routing.routes["/getuserid"](
	{ query: {
	    sourceurl: tempsourceurl,
	    experimentName: tempexperimentname
	}}, {
	    end: function(data){
		assert.equal(data, '("2")');
		done();
	    }
	});
    });
});

describe("dbwrite", function(){
    it("Should fail if request is faulty", function(done){
	var dones = 4;
	function doneifdone(){
	    dones -= 1;
	    if(dones === 0) done();
	}
	routing.routes["/dbwrite"]({query: {}}, {
	    end: function(data){
		assert.equal(data, '("false")');
		doneifdone();
	    }
	});
	routing.routes["/dbwrite"]({query: {
	    userFileName: 5,
	    userCode: "JANI",
	    sourceurl: "no.where"
	}}, {
	    end: function(data){
		assert.equal(data, '("false")');
		doneifdone();
	    }
	});
	routing.routes["/dbwrite"]({query: {
	    experimentName: "xxx"
	}}, {
	    end: function(data){
		assert.equal(data, '("false")');
		doneifdone();
	    }
	});
	routing.routes["/dbwrite"]({}, {
	    end: function(data){
		assert.equal(data, '("false")');
		doneifdone();
	    }
	});
    });
    it("Should otherwise write to the database", function(done){
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
		    var collname = util.createCollectionName(q.query.sourceurl, q.query.experimentName);
		    _db.collection(collname).findOne({info: now.getTime()}, function(err, doc){
			assert.equal(err, null);
			assert.equal(doc.userCode, "Tester");
			assert.equal(doc.IP, "127.0.0.1");
			_db.collection(collname).remove({info: now.getTime()}, function(err, result){
			    assert.equal(err, null);
			    assert.equal(result.result.n, 1);
			    done();
			});
		    });
		});
	    }
	});
    });
});


describe("Make CSV", function(){
    var data = [{alef: 1, bet: 2, gimel: 3},
		{alef: 3},
		{bet: 5},
		{dalet: 9}];
    var fieldnames = [];
    it("Should find out field names in a table", function(){
	fieldnames = util.getAllFieldNames(data);
	assert.equal(fieldnames.indexOf("alef") > -1, true);
	assert.equal(fieldnames.indexOf("bet") > -1, true);
	assert.equal(fieldnames.indexOf("gimel") > -1, true);
	assert.equal(fieldnames.indexOf("dalet") > -1, true);
	assert.equal(fieldnames.length, 4);
    });
    it("Should be able to tab separate values", function(){
	var str0 = util.formTSVLine(data[0], fieldnames);
	var str2 = util.formTSVLine(data[2], fieldnames);
	assert.equal(str0, "1\t2\t3\t\n");
	assert.equal(str2, "\t5\t\t\n");
    });
    it("Should give me back a nice TSV", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname
	    }
	};
	var buf = "";
	var res = {
	    write: function(data){
		buf += data;
	    },
	    end: function(data){
		if(data)
		    buf += data;
		var lines = buf.split("\n");
		assert.equal(lines.length, NTOWRITE+2); // +header + last final \n
		assert.equal(lines[0].indexOf("userCode") > -1, true);
		assert.equal(lines[0].indexOf("userFileName") > -1, true);
		assert.equal(lines[0].indexOf("response") > -1, true);
		assert.equal(lines[0].indexOf("sourceurl") > -1, true);
		assert.equal(lines[0].indexOf("experimentName") > -1, true);
		assert.equal(lines[0].indexOf("i") > -1, true);
		var fieldnames = lines[0].split("\t");
		assert.equal(fieldnames.length, 6);
		var fields88 = lines[NTOWRITE-11].split("\t");
		assert.equal(fields88.length, 6);
		assert.equal(fields88[fieldnames.indexOf("experimentName")],
			     tempexperimentname);
		assert.equal(fields88[fieldnames.indexOf("response")],
			     "good");
		done();
	    }
	};
	routing.routes["/makecsv"](req, res);
    });
    it("Should tell me if there's no such experiment", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname + "doesntexist"
	    }
	};
	var res = {
	    end: function(data){
		assert.equal(data, "No such experiment!");
		done();
	    }
	};
	routing.routes["/makecsv"](req, res);
    });
    it("Should read other CSV's than the default", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname,
		file: "different.csv"
	    }
	};
	var buf = "";
	var res = {
	    write: function(data){
		buf += data;
	    },
	    end: function(data){
		if(data)
		    buf += data;
		var lines = buf.split("\n");
		assert.equal(lines.length, 3); // header + newline + line
		var fns = lines[0].split("\t"),
		    dataline = lines[1].split("\t");
		assert.equal(fns.indexOf("destination") > -1, true);
		assert.equal(fns.indexOf("fieldOnlyHere") > -1, true);
		assert.equal(fns.indexOf("i"), -1);
		assert.equal(dataline[fns.indexOf("destination")], "different.csv");
		assert.equal(dataline[fns.indexOf("fieldOnlyHere")], "1");
		done();
	    }
	};
	routing.routes["/makecsv"](req, res);
	
    });
});


describe("users.csv", function(){
    it("Should tell me if there's no such experiment", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname + "doesntexist"
	    }
	};
	var res = {
	    end: function(data){
		assert.equal(data, "No such experiment!");
		done();
	    }
	};
	routing.routes["/users"](req, res);
    });
    it("Should give me back a valid record count", function(done){
	var fizzbuzzexpected = Math.floor(NTOWRITE / 15) + 1,
	    plainexpected = NTOWRITE - fizzbuzzexpected,
	    req = {query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname
	    }},
	    buf = "",
	    res = {
		write: function(data){
		    buf += data;
		},
		end: function(data){
		    if(data)
			buf += data;
		    var lines = buf.split("\n");
		    assert.equal(lines.length, 5); // header+plain+fizzbuzz+weird+nl
		    var fn = lines[0].split("\t");
		    assert.equal(fn.length, 2);
		    assert.equal(fn.indexOf("userCode") > -1, true);
		    assert.equal(fn.indexOf("records") > -1, true);
		    for(var i = 1; i < 4; i++){
			var fields = lines[i].split("\t"),
			    uc = fields[fn.indexOf("userCode")],
			    rec = fields[fn.indexOf("records")];
			switch (uc){
			case "Tester":
			    assert.equal(rec, plainexpected.toString());
			    break;
			case "TesterFizzBuzz":
			    assert.equal(rec, fizzbuzzexpected.toString());
			    break;
			case "WeirdTester":
			    assert.equal(rec, "1");
			    break;
			default:
			    assert.equal(true, false);
			}
		    }
		    done();
		}		    
	    };
	routing.routes["/users"](req, res);
    });
});

describe("Get destinations", function(){
    it("Should tell me if there's no such experiment", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname + "doesntexist"
	    }
	};
	var res = {
	    end: function(data){
		assert.equal(data, "No such experiment!");
		done();
	    }
	};
	routing.routes["/destinations"](req, res);
    });
    it("Should give back the valid destination list", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname
	    }
	};
	var res = {
	    end: function(data){
                var dests;
                assert.doesNotThrow(function(){
                    dests = JSON.parse(data);
                });
                assert.ok(dests.length);
                assert.equal(dests.length, 2);
                assert.equal(dests.indexOf("default.csv") > -1, true);
                assert.equal(dests.indexOf("different.csv") > -1, true);
                done();
	    }
	};
	routing.routes["/destinations"](req, res);
    });
});


describe("Removal", function(){	 
    it("Should be able to remove an experiment", function(done){
	db.removeExperiment(tempsourceurl, tempexperimentname, function(err, res){
	    assert.equal(err, null);
	    assert.ok(res.result);
	    assert.equal(res.result.ok, 1);
	    assert.equal(res.result.n, written+1);
	    db.getAllData(tempsourceurl, tempexperimentname, function(err, results){
		assert.equal(err, db.NOSUCHEXPERIMENT);
		done();
	    });
	});
    });
});

describe.skip("Stresstest", function(){
    var STRESSN = 100000;
    this.timeout(100 * 1000);
    it("Should be able to write " + STRESSN + " documents", function(done){
	db.getDB(function(err, db){
	    assert.equal(err, null);
	    var collname = util.createCollectionName(util.cleanURL(tempsourceurl), tempexperimentname + ".stresstest");
	    var coll = db.collection(collname);
	    var docs = [];
	    for(var i = 0; i < STRESSN; i++){
		docs.push({experimentName: tempexperimentname + ".stresstest",
			   val: i});
	    }
	    assert.equal(docs.length, STRESSN);
	    coll.insertMany(docs, function(err, r){
		console.log("ERR: " + err);
		console.log("R: " + r);
		assert.equal(err, null);
		assert.equal(r.insertedCount, STRESSN);
		done();
	    });
	});
    });
    it("Should be able to get the TSV", function(done){
	var req = {
	    query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname + ".stresstest"
	    }
	};
	var buf = "";
	var res = {
	    write: function(data){
		buf += data;
	    },
	    end: function(data){
		if(data)
		    buf += data;
		var lines = buf.split("\n");
		assert.equal(lines.length, STRESSN+2); // +header + last final \n
		assert.equal(lines[0].indexOf("i") > -1, true);
		done();
	    }
	};
	routing.routes["/makecsv"](req, res);
    });
    it("Should be able to clean up", function(done){
	db.removeExperiment(tempsourceurl, tempexperimentname + ".stresstest", function(err, res){
	    assert.equal(err, null);
	    assert.ok(res.result);
	    assert.equal(res.result.ok, 1);
	    assert.equal(res.result.n, STRESSN);
	    done();
	});	
    });
});

describe("Logging", function(){
    it("Should write to log", function(done){
        util.Logger.setFile("test.log");
        util.Logger.log("Heyho 1");
        util.Logger.log("Heyho 2");
        fs.readFile("test.log", "utf8", function(err, data){
            assert.equal(err, null);
            assert.equal(data.split("\n").length, 3);
            assert.equal(data.split("\n")[0].split("\t").length, 2);
            assert.equal(data.split("\n")[0].split("\t")[1], "Heyho 1");
            done();
        });
    });
    it("Should clear up after itself", function(done){
        util.Logger.clear();
        fs.access("test.log", function(err, stats){
            assert.ok(err);
            done();
        });
    });
});

	 
after("Cleaning up", function(){
    db.closeDB();
});

