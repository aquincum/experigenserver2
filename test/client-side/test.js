
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
    var apiService, responder;
    beforeEach(module("adminApp"));
    beforeEach(inject(function(_apiService_, _responder_){
        apiService = _apiService_;
        responder = _responder_;
        spyOn(responder, "respond");
    }));

    it("Should handle errors", function(){
        apiService.handleError({
            status: 400,
            data: "test"
        });
        expect(responder.respond).toHaveBeenCalledWith("Problem with the request. test", "danger");
    });
});
