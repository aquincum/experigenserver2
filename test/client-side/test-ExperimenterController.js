require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;
var crypto = require("crypto-js");
var reqAuthDigest = require("../../reqAuthDigest");


var expectAuthedRequest = function($httpBackend, url, method, response){
    if(typeof response == "string") {
        response = {
            data: response,
            status: 200
        };
    }
    $httpBackend.expect(method, url).respond(function(){
        $httpBackend.resetExpectations();
        $httpBackend.expect(method, url).respond(response.status, response.data);
        return[401, null, {
            "www-authenticate": 'Digest realm="Experimenters",nonce="'+
                reqAuthDigest.nonce(32)+'",uri="'+url+'",qop="auth"'
        }];
    });
};

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
        expectAuthedRequest($httpBackend, "/auth/teszt", "GET", "jej");
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

    it("Should send a correct login", function (done){
        expectAuthedRequest($httpBackend, "/auth/me", "GET", "alma");
        authService.setExperimenter("alma");
        authService.setPassword("korte");
        authService.login(function(li){
            expect(li).toEqual(true);
            expect(authService.getLoggedIn()).toEqual(true);
            done();
        });
        $httpBackend.flush();
    });
    it("Should send an incorrect login and react as such", function (done){
        expectAuthedRequest($httpBackend, "/auth/me", "GET", {
            status: 401,
            data: "none"
        });
        authService.setExperimenter("alma");
        authService.setPassword("k0rte");
        authService.login(function(li){
            expect(li).toEqual(false);
            expect(authService.getLoggedIn()).toEqual(false);
            done();
        });
        $httpBackend.flush();
    });
    it("Should send a correct logout", function (done){
        expectAuthedRequest($httpBackend, "/auth/me", "GET", "alma");
        authService.setExperimenter("alma");
        authService.setPassword("korte");
        authService.login(function(li){
            authService.logout();
            expect(authService.getLoggedIn()).toEqual(false);
            done();
        });
        $httpBackend.flush();
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

