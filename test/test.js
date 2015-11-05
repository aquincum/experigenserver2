var assert = require("assert");
var routing = require("../routing");
var db = require("../db");
var util = require("../util");

// let's do this
/* first */
describe("Routing", function(){
    it("Should route to functions to responses", function(){
	var mockServer = {
	    get: function(path, func){
		assert.equal(typeof func, "function");
	    }
	};
	routing(mockServer);
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

describe("Database", function(){
    it("Should connect", function(){
	db.getDB(function(err, db){
	    assert.ok(db);
	});
    });
    if(0) it("Should give me 1 as userfilename", function(){
	var ufn = db.getUserFileName("000xxtest000");
	assert.equal(ufn, 1);
    });
});
