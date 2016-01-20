require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;
var crypto = require("crypto-js");

describe("ExperimenterController", function(){
    var cCtrl, $rootScope, scope, $httpBackend, responder;
    var username = "tester";
    var password = "verysecret!";
    var ha1 = crypto.MD5(username + ":Experimenters:" + password).toString();
    beforeEach(angular.mock.module("adminApp"));
    beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _responder_){
        responder = _responder_;
        $httpBackend = _$httpBackend_;
        scope = _$rootScope_.$new();
        cCtrl = function(){
            return _$controller_("ExperimenterController", {
                "$scope": scope
            });
        };
        spyOn(responder, "respond");
    }));

    it("Placeholder", function(){
        var ctrl = cCtrl();
        expect(1).toEqual(1);
    });
    /*it("Should send a proper registration", function(){
        var ctrl = cCtrl();
    });*/
});

