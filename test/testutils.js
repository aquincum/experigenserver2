var request = require("supertest");
var assert = require("assert");
var reqAuthDigest = require("../reqAuthDigest");


var expectAuthDigest = function expectAuthDigest(uri, username, password, method, server, cb){
    var newheader = "";
    request(server)[method](uri).expect(401)
        .expect(function(res){
            newheader = reqAuthDigest.reqAuthDigest(uri, username, password, method, res.headers);
        })
        .end(function(){
            cb((request(server)[method](uri).set("Authorization", newheader)));
        });
    //  return new Test(this.app,
};

module.exports = {
    HA1: reqAuthDigest.HA1,
    expectAuthDigest: expectAuthDigest
};
