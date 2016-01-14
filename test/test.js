var assert = require("assert");
var routing = require("../server/routing");
var db = require("../server/db");
var util = require("../server/util");
var Experiment = require("../server/models/experiment");
var fs = require("fs");
var request = require("supertest");

var NTOWRITE = 100;
var tempsourceurl = "http://localhost/testing/now";
var tempexperimentname = "000test000";
var experiment = new Experiment(tempsourceurl, tempexperimentname);
var written = 0;
// let's do this
var server;
var testutils = require("./testutils");
var HA1 = testutils.HA1;
var expectAuthDigest = testutils.expectAuthDigest;

// from passport-http

before("Connecting to the server", function(){
    server = require("../main");
});

describe("Routing", function(){
    it("Should route to functions to responses", function(done){
	var mockServer = {
	    get: function(path, func){
		assert.equal(typeof func, "function");
	    },
            use: function(){},
            post: function(path, func){
		assert.equal(typeof func, "function");
	    },
            delete: function(path, func){
		assert.equal(typeof func, "function");
	    },
            put: function(path, func){
		assert.equal(typeof func, "function");
	    }
	};
	routing.route(mockServer);
	done();
    });
    it("Should give me back the version string", function(done){
        request(server)
            .get("/version")
            .expect(200)
            .expect(require("../package.json").version, done);
    });
    it("Shouldn't serve .cgi if not emulating", function(done){
	var mockServer = {
	    get: function(path, func){
		assert.notEqual(path.slice(path.length-4, path.length), ".cgi");
	    },
            use: function(){},
            post: function(){},
            put: function(){},
            delete: function(){},
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
	    },
            use: function(){},
            post: function(){},
            put: function(){},
            delete: function(){},
	};
	routing.route(mockServer, true);
	assert.equal(cgis > 0, true);
	done();
    });
    it("Should serve the four original services", function(done){
        var dones = 0,
            addDone = 
        ["/dbwrite", "/makecsv", "/users", "/getuserid"].map(function(service){
            request(server).get(service).expect(200, function(){
                dones ++;
                if (dones == 4) done();
            });
        });
    });
});

describe("URL cleaning", function(){
    it("should be okay with simple strings", function(){
	var teststrings = ["almaKORTE123...ahha",
			  "asdasdasd!asd",
			   "()mhm'"];
	teststrings.map(function(ts){
	    assert.equal((new Experiment(ts)).cleanURL(), ts);
	});
    });
    it("should take off http://", function(){
	assert.equal((new Experiment("http://my.site")).cleanURL(), "my.site");
    });
    it("should chop off /", function(){
	assert.equal((new Experiment("http://my.site/")).cleanURL(), "my.site");
    });
    it("should be replacing : and / with dots", function(){
	assert.equal((new Experiment("http://my.site/my/path/")).cleanURL(), "my.site.my.path");
    });
    it("should be removing tildes", function(){
	assert.equal((new Experiment("http://my.site/~home/")).cleanURL(), "my.site.home");
    });
    it("should not take off https://", function(){
	assert.equal((new Experiment("https://my.site/")).cleanURL(), "https...my.site");
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
	var cn = (new Experiment(teststrings[0], teststrings[1])).createCollectionName();
	assert.equal(cn, (new Experiment(teststrings[0], teststrings[1])).createCollectionName());
	assert.notEqual(cn, (new Experiment(teststrings[0]+"q", teststrings[1])).createCollectionName());
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
        var newexperiment = new Experiment(tempsourceurl, tempexperimentname + "even.newer");
	newexperiment.getUserFileName(function(result){
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
	    experiment.write(inserted, writecb);
	}
	// let's write one more to a different destination.
	var diffDest = JSON.parse(q);
	diffDest.destination = "different.csv";
	diffDest.fieldOnlyHere = 1;
	diffDest.userCode = "WeirdTester";
	delete diffDest.i;
	experiment.write(diffDest, function(succ){
	    assert.equal(succ, true);
	    ran++;
	    if (ran == NTOWRITE+1) wrapup();
	});
    });
    it("Should be able to give me back all the data in an Array", function(done){
	experiment.getAllData(function(err, results){
	    assert.equal(err, null);
	    assert.equal(results.length, written);
	    //	    assert.equal(results[432].i, 432);
	    assert.equal(results[21].i >= 0, true);
	    assert.equal(results[written-4].response, "good");
	    done();
	});
    });
    it("Should be able to write to a different destination", function(done){
	experiment.getAllData("different.csv", function(err, results){
	    assert.equal(err, null);
	    assert.equal(results.length, 1);
	    assert.equal(results[0].destination, "different.csv");
	    done();
	});
    });
});

describe("getuserid", function(){
    it("Should give back 0 if problems in request", function(done){
        request(server)
            .get("/getuserid")
            .expect(200)
            .expect('("0")', done);
    });
    it("Should give back 1 if new experiment", function(done){
        request(server)
            .get("/getuserid?sourceurl=" + tempsourceurl +
                 "&experimentName=" + tempexperimentname + "givback1")
            .expect(200)
            .expect('("1")', done);
    });
    it("Should give back 2 after 1 user", function(done){
        request(server)
            .get("/getuserid?sourceurl=" + tempsourceurl +
                 "&experimentName=" + tempexperimentname)
            .expect(200)
            .expect('("2")', done);
    });
});

describe("dbwrite", function(){
    it("Should fail if request is faulty", function(done){
	var dones = 3;
	function doneifdone(){
	    dones -= 1;
	    if(dones === 0) done();
	}
        request(server)
            .get("/dbwrite")
            .expect(200)
            .expect('("false")', doneifdone);
        request(server)
            .get("/dbwrite?userCode=JANI&userFileName=5&sourceurl=no.where")
            .expect(200)
            .expect('("false")', doneifdone);
        request(server)
            .get("/dbwrite?experimentName=xxx")
            .expect(200)
            .expect('("false")', doneifdone);
    });
    var now = (new Date()).getTime();
    it("Should otherwise write to the database", function(done){
        request(server)
            .get("/dbwrite?experimentName=" + tempexperimentname + "q&" +
                 "sourceurl=" + tempsourceurl + "&" +
                 "userCode=Tester&" +
                 "userFileName=1&" +
                 "info=" + now
                )
            .expect(200)
            .expect('("true")', done);
    });
    it("Which should be there in the database", function(done){
	db.getDB(function(err, _db){
            var qexperiment = new Experiment(tempsourceurl, tempexperimentname + "q");
            qexperiment.cleanURL();
	    var collname = qexperiment.createCollectionName();
            console.log("XXX", collname);
            _db.collection(collname).count({}, function(err, n){
                assert.equal(err, null);
                assert.equal(n, 1);
	        _db.collection(collname).findOne({info: now.toString()}, function(err, doc){
		    assert.equal(err, null);
		    assert.equal(doc.userCode, "Tester");
		    assert.equal(doc.IP, "::ffff:127.0.0.1");
		    _db.collection(collname).remove({info: now.toString()}, function(err, result){
		        assert.equal(err, null);
		    assert.equal(result.result.n, 1);
		        done();
		    });
	        });
            });
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
        request(server)
            .get('/makecsv?sourceurl=' + tempsourceurl +
                 '&experimentName=' + tempexperimentname)
            .expect(200)
            .expect(function(res){
		var lines = res.text.split("\n");
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
	    })
            .end(done);
    });
    it("Should tell me if there's no such experiment", function(done){
        request(server)
            .get('/makecsv?sourceurl=' + tempsourceurl +
                 '&experimentName=' + tempexperimentname + "doesntexist")
            .expect(200)
	    .expect("No such experiment!", done);
    });
    it("Should read other CSV's than the default", function(done){
        request(server)
            .get('/makecsv?sourceurl=' + tempsourceurl +
                 '&experimentName=' + tempexperimentname +
                 '&file=different.csv')
            .expect(200)
        
	    .expect(function(res){
		var lines = res.text.split("\n");
		assert.equal(lines.length, 3); // header + newline + line
		var fns = lines[0].split("\t"),
		    dataline = lines[1].split("\t");
		assert.equal(fns.indexOf("destination") > -1, true);
		assert.equal(fns.indexOf("fieldOnlyHere") > -1, true);
		assert.equal(fns.indexOf("i"), -1);
		assert.equal(dataline[fns.indexOf("destination")], "different.csv");
		assert.equal(dataline[fns.indexOf("fieldOnlyHere")], "1");
	    })
            .end(done);
    });
});


describe("users.csv", function(){
    it("Should tell me if there's no such experiment", function(done){
        request(server)
            .get("/users?sourceurl=" + tempsourceurl + "&" +
                 "&experimentName=" + tempexperimentname + "doesntexist")
            .expect(200)
            .expect("No such experiment!", done);
    });
    it("Should give me back a valid record count", function(done){
	var fizzbuzzexpected = Math.floor(NTOWRITE / 15) + 1,
	    plainexpected = NTOWRITE - fizzbuzzexpected,
	    req = {query: {
		sourceurl: tempsourceurl,
		experimentName: tempexperimentname
	    }},
	    buf = "";

        request(server)
            .get("/users?sourceurl=" + tempsourceurl + "&" +
                 "&experimentName=" + tempexperimentname)
            .expect(200)
            .expect(function(res){
		var lines = res.text.split("\n");
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
	    })
            .end(done);
    });
});

describe("Get destinations", function(){
    it("Should tell me if there's no such experiment", function(done){
        request(server)
            .get("/destinations?sourceurl=" + tempsourceurl + "&" +
                 "&experimentName=" + tempexperimentname + "doesntexist")
            .expect(200)
            .expect("No such experiment!", done);
    });
    it("Should give back the valid destination list", function(done){
        request(server)
            .get("/destinations?sourceurl=" + tempsourceurl + "&" +
                 "&experimentName=" + tempexperimentname)
            .expect(200)
            .expect(function(res){
                var dests;
                assert.doesNotThrow(function(){
                    dests = JSON.parse(res.text);
                });
                assert.ok(dests.length);
                assert.equal(dests.length, 2);
                assert.equal(dests.indexOf("default.csv") > -1, true);
                assert.equal(dests.indexOf("different.csv") > -1, true);
            })
            .end(done);
    });
});


describe("Removal", function(){
    it("Should be able to remove an experiment", function(done){
	experiment.removeExperiment(function(err, res){
	    assert.equal(err, null);
	    assert.ok(res.result);
	    assert.equal(res.result.ok, 1);
	    assert.equal(res.result.n, written+1);
	    experiment.getAllData(function(err, results){
		assert.equal(err, Experiment.NOSUCHEXPERIMENT);
		done();
	    });
	});
    });
});

describe.skip("Stresstest", function(){
    var STRESSN = 100000;
    var stressExp = new Experiment(tempsourceurl, tempexperimentname + ".stresstest");
    this.timeout(100 * 1000);
    it("Should be able to write " + STRESSN + " documents", function(done){
        stressExp.connectToCollection(function(err, coll){
	    assert.equal(err, null);
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
        request(server)
            .get('/makecsv?sourceurl=' + tempsourceurl +
                 '&experimentName=' + tempexperimentname + '.stresstest')
            .expect(200)
	    .expect(function(res){
		var lines = res.text.split("\n");
		assert.equal(lines.length, STRESSN+2); // +header + last final \n
		assert.equal(lines[0].indexOf("i") > -1, true);
            })
            .end(done);
    });
    it("Should be able to clean up", function(done){
	stressExp.removeExperiment(function(err, res){
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

var username = "tester00001",
    password1 = "password1",
    password2 = "otherpassword",
    ha11 = HA1(username, password1),
    ha12 = HA1(username, password2);


describe("Experimenter accounts", function(){
    describe("insertion", function(){
        it("Should insert new experimenters", function(done){
            request(server)
                .post("/experimenter?experimenter=" + username + 
                     "&ha1=" + ha11)
                .expect(200)
                .expect("done", done);
        });
        it("Should not insert duplicates", function(done){
            request(server)
                .post("/experimenter?experimenter=" + username + 
                     "&ha1=" + ha11)
                .expect(409)
                .expect("conflict", done);
        });
        it("Should not insert with no password", function(done){
            request(server)
                .post("/experimenter?experimenter=" + username + "X")
                .expect(400)
                .expect("Wrong request!", done);
        });
    });
    describe("ME", function(){
        it("Should be able to verify login with /me", function(done){
            expectAuthDigest("/me",
                             username,
                             password1,
                             "get",
                             server,
                             function(r){
                                 r.expect(200).expect(username, done);
                             });
        });
        it("Should reject bad login with /me", function(done){
            expectAuthDigest("/me",
                             username,
                             password2,
                             "get",
                             server,
                             function(r){
                                 r.expect(401, done);
                             });
        });
    });
    describe("update", function(){
        it("Should be able to update the current existing experimenter", function(done){
            expectAuthDigest("/experimenter?experimenter=" + username + "&ha1=" + ha12,
                             username,
                             password1,
                             "put",
                             server,
                             function(r){
                                 r.expect(200).expect("done", done);
                             });
        });
        it("Should not update with no login", function(done){
            request(server)
                .put("/experimenter?experimenter=" + username + 
                     "&ha1=" + ha11)
                .expect(401, done);
        });
        it("Should not update with wrong experimenter login", function(done){
            request(server)
                .post("/experimenter?experimenter=" + username + "x" + 
                      "&ha1=" + HA1(username + "x", password1))
                .expect(200)
                .expect("done")
                .end(function(){
                    expectAuthDigest("/experimenter?experimenter=" + username + "&ha1=" + ha11,
                                     username + "x",
                                     password1,
                                     "put",
                                     server,
                                     function(r){
                                         r.expect(403).expect("not authorized", done);
                                     });
                });
        });
        it("Should not update with wrong password", function(done){
            expectAuthDigest("/experimenter?experimenter=" + username + "&ha1=" + ha11,
                             username,
                             password1 + "sure to be false",
                             "put",
                             server,
                             function(r){
                                 r.expect(401, done);
                             });
        });
    });
    describe("get", function(){
        it("Should be able to retrieve an experimenter", function(done){
            request(server)
                .get("/experimenter?experimenter=" + username)
                .expect(200)
                .expect(username, done);
        });
        it("Should be able to respond to non existing experimenter request", function(done){
            request(server)
                .get("/experimenter?experimenter=" + username + "Y")
                .expect(404)
                .expect("none", done);
        });
    });
    describe("Registration", function(){
        var insideurl = (new Experiment(tempsourceurl,"")).cleanURL();
        it("Should register a new experiment", function(done){
            expectAuthDigest("/registration?experimenter=" + username + 
                             "&sourceurl=" + encodeURIComponent(tempsourceurl) +
                             "&experimentName=" + tempexperimentname,
                             username,
                             password2,
                             "post",
                             server,
                             function(r){
                                 r.expect(200, done);
                             });
                            
        });
        it("Should be there", function(done){
            db.getDB(function(err, _db){
                _db.collection("registration").count({}, function(err, n){
                    assert.equal(err, null);
                    assert.equal(n, 1);
                    _db.collection("registration").findOne({experimenter: username}, function(err, doc){
                        console.log("DOC: ", doc);
                        assert.equal(doc.experimenter, username);
                        assert.equal(doc.experiment.sourceUrl, insideurl);
                        assert.equal(doc.experiment.experimentName, tempexperimentname);
                        done();
                    });
                });
            });
        });
        it.skip("Should reject a bad request");
        it.skip("Should forbid registering an already existing experiment");
        it("Should remove registration", function(done){
            expectAuthDigest("/registration?experimenter=" + username +
                             "&sourceurl=" + encodeURIComponent(tempsourceurl) +
                             "&experimentName=" + tempexperimentname,
                             username,
                             password2,
                             "delete",
                             server,
                             function(r){
                                 r.expect(200, done);
                             });
        });
        it("Should be cleaned up", function(done){
            db.getDB(function(err, _db){
                _db.collection("registration").remove({}, function(err, n){
                    assert.equal(err, null);
                    done();
                });
            });
        });
    });
    describe("Experimenter deletion", function(){
        it("Should not delete with wrong authentication", function(done){
            expectAuthDigest("/experimenter?experimenter=" + username,
                             username + "x",
                             password1,
                             "delete",
                             server,
                             function(r){
                                 r.expect(403).expect("not authorized", done);
                             });
        });
        it("Should delete the existing experimenter", function(done){
            expectAuthDigest("/experimenter?experimenter=" + username,
                             username,
                             password2,
                             "delete",
                             server,
                             function(r){
                                 r.expect(200).expect("done", done);
                             });
        });
        it("Should delete the other existing experimenter", function(done){
            expectAuthDigest("/experimenter?experimenter=" + username + "x",
                             username + "x",
                             password1,
                             "delete",
                             server,
                             function(r){
                                 r.expect(200).expect("done", done);
                             });
        });
        it("Finally, experimenter db should be empty", function(done){
            db.getDB(function(err, db){
                assert.equal(err, null);
                db.collection("experimenters").count(function(err, n){
                    assert.equal(err, null);
                    assert.equal(n, 0);
                    done();
                });
            });
        });
    });
});



after("Cleaning up", function(){
    db.closeDB();
    server.close();
});

