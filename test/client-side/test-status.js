require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;


describe("statusController & responder", function(){
    var cCtrl, responder, $rootScope, scope;
    beforeEach(angular.mock.module("adminApp"));
    beforeEach(inject(function($controller, _responder_,_$rootScope_){
        responder = _responder_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
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
    it("Should respond to broadcast", function(){
        var ctlr = cCtrl();
        $rootScope.$broadcast("statusUpdate", "Testing", "it");
        expect(scope.status.text).toEqual("Testing");
        expect(scope.status.alert).toEqual("it");
    });
    it("Should respond to responder", function(){
        var ctlr = cCtrl();
        responder.respond("Testing", "it");
        expect(scope.status.text).toEqual("Testing");
        expect(scope.status.alert).toEqual("it");
    });

});

