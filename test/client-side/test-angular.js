require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var inject = angular.mock.inject;
require("../../public/js/modules/adminApp");

describe("Angular", function(){
    it("Tools should exist", function(){
        expect(angular).toBeDefined();
        expect(inject).toBeDefined();
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
