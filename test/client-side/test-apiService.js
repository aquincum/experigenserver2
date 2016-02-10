require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;

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
    beforeEach(angular.mock.module("adminApp"));
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
        apiService.apiCall("users", mockScope).then(function(d){
            expect(d.data).toEqual("!");
            done();
        });
        $httpBackend.expectGET(mockScope.url());
        $httpBackend.flush();
    });
    it("Should handle errors on API calls", function(done){
        $httpBackend.whenGET(mockScope.url())
            .respond(404);
        try{
            apiService.apiCall("users", mockScope);
            $httpBackend.expectGET(mockScope.url());
            $httpBackend.flush();
        }
        catch(e){
            expect(responder.respond).toHaveBeenCalledWith("Experiment does not exist!", "danger");
            expect(e.status).toEqual(404);
            done();
        }
    });
});
