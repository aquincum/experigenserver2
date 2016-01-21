require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;
var crypto = require("crypto-js");
var reqAuthDigest = require("../../reqAuthDigest");

describe("authService", function(){
    var $rootScope, scope, $httpBackend, authService;
    beforeEach(angular.mock.module("adminApp"));
    beforeEach(inject(function(_$rootScope_, _$httpBackend_, _authService_){
        $httpBackend = _$httpBackend_;
        authService = _authService_;
        $rootScope = _$rootScope_;
    }));

    it("Should start logged out", function(){
        expect(authService.getLoggedIn()).toEqual(false);
    });

    it("ajaxDigest should work", function(done){
        $httpBackend.expectGET("/auth/teszt").respond(function(){
            $httpBackend.resetExpectations();
            $httpBackend.expectGET("/auth/teszt").respond(200, "jej");
            return[401, null, {
                "www-authenticate": 'Digest realm="Experimenters",nonce="'+
                    reqAuthDigest.nonce(32)+'",uri="/auth/teszt",qop="auth"'
            }];
        });
        authService.setExperimenter("alma");
        authService.setPassword("korte");
        authService.ajaxDigest("/auth/teszt", "get").then(function(resp){
            expect(resp.data).toEqual("jej");
            done();
        }).catch(function(resp){
            throw "Fail: " + resp.status;
        });
        $httpBackend.flush();
    });

    xit("Should send a correct login", function (done){
            $httpBackend.whenGET("/auth/me").respond(401, null, {
            "www-authenticate": "Digest realm=Experimenters,nonce="+
                reqAuthDigest.nonce(32)+",uri=/auth/me,qop=auth"
        });
        authService.setExperimenter("alma");
        authService.setPassword("korte");
        authService.login(function(li){
            expect(li).toEqual(true);
            expect(authService.getLoggedIn()).toEqual(true);
            done();
        });
    });
});


describe("ExperimenterController", function(){
    var cCtrl, $rootScope, scope, $httpBackend, responder, authService;
    var username = "tester";
    var password = "verysecret!";
    var ha1 = crypto.MD5(username + ":Experimenters:" + password).toString();
    beforeEach(angular.mock.module("adminApp"));
    beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _responder_,_authService_){
        responder = _responder_;
        $httpBackend = _$httpBackend_;
        authService = _authService_;
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
        
    });
    /*it("Should send a proper registration", function(){
        var ctrl = cCtrl();
    });*/
});

