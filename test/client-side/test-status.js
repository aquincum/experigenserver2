require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;


describe("statusController & responder", function(){
    var cCtrl, responder, $rootScope, scope, $timeout;
    beforeEach(angular.mock.module("adminApp"));
    beforeEach(inject(function($controller, _responder_,_$rootScope_,_$timeout_){
        responder = _responder_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $timeout = _$timeout_;
        cCtrl = function(){
            return $controller("StatusController", {
                "$scope": scope
            });
        };
        //spyOn(responder, "respond");
    }));

    it("Should start by a nice welcome!", function(){
        var ctlr = cCtrl();
        expect(scope.status.text).toEqual("Welcome!");
    });
    it("Should respond to broadcast", function(done){
        var ctlr = cCtrl();
        $timeout(function(){
            $rootScope.$broadcast("statusUpdate", "Testing", "it");
            $timeout(function(){
                expect(scope.status.text).toEqual("Testing");
                expect(scope.status.alert).toEqual("it");
                done();
            }, 1);
            $timeout.flush();
        }, 0);
        $timeout.flush();
    });
    it("Should respond to responder", function(done){
        var ctlr = cCtrl();
        $timeout(function(){
            responder.respond("Testing", "it");
            $timeout(function(){
                expect(scope.status.text).toEqual("Testing");
                expect(scope.status.alert).toEqual("it");
                done();
            },1);
            $timeout.flush();
        },0);
        $timeout.flush();
    });

});

