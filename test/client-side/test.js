
describe("Angular", function(){
    it("Tools should exist", function(){
        expect(angular).toBeDefined();
        expect(inject).toBeDefined();
        expect(module).toBeDefined();
    });
    it("The adminApp module should exist", function(){
        expect(angular.module("adminApp")).toBeDefined();
    });
    it("My controllers should exist", function(){
        var ctlrs = ["statusController", "experimentDownloadController", "experimenterCtrl"];
        ctlrs.map(function(ctlr){
            expect(angular.module("adminApp").controller(ctlr)).toBeDefined();
        });
    });
});


describe("apiService", function(){
    var apiService, responder, $httpBackend;
    var mockScope = {
        sourceURL: "x",
        experimentName: "y",
        getDestination: function() { return "z"; },
        url: function(){
            return "/users?sourceurl=" +
                this.sourceURL + "&experimentName=" +
                this.experimentName + "&file=" +
                this.getDestination();
        }
    };
    beforeEach(module("adminApp"));
    beforeEach(inject(function(_apiService_, _responder_,_$httpBackend_){
        apiService = _apiService_;
        responder = _responder_;
        $httpBackend = _$httpBackend_;
        spyOn(responder, "respond");
    }));

    it("Should handle errors", function(){
        apiService.handleError({
            status: 400,
            data: "test"
        });
        expect(responder.respond).toHaveBeenCalledWith("Problem with the request. test", "danger");
    });

    it("Should ask for some proper API calls", function(done){
        $httpBackend.whenGET(mockScope.url())
            .respond("!");
        apiService.apiCall("users", mockScope, function(d){
            expect(d.data).toEqual("!");
            done();
        });
        $httpBackend.expectGET(mockScope.url());
        $httpBackend.flush();
    });
    it("Should handle errors on API calls", function(){
        $httpBackend.whenGET(mockScope.url())
            .respond(404);
        apiService.apiCall("users", mockScope);
        $httpBackend.expectGET(mockScope.url());
        $httpBackend.flush();
        expect(responder.respond).toHaveBeenCalledWith("Experiment does not exist!", "danger");
    });
});

describe("statusController & responder", function(){
    var cCtrl, responder, $rootScope, scope;
    beforeEach(module("adminApp"));
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
