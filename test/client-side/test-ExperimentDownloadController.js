require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var angularFS = require("angular-file-saver");
var inject = angular.mock.inject;

describe("ExperimentDownloadController", function(){
    var cCtrl, responder, scope, $httpBackend, $window, FileSaver;
    beforeEach(angular.mock.module("adminApp"));
    beforeEach(inject(function($controller, _$httpBackend_,_$rootScope_, _responder_, _FileSaver_){
        responder = _responder_;
        $httpBackend = _$httpBackend_;
        scope = _$rootScope_.$new();
        FileSaver = _FileSaver_;
        cCtrl = function(){
            return $controller("ExperimentDownloadController", {
                "$scope": scope
            });
        };
        spyOn(responder, "respond");
    }));

    it("Should get the correct destination", function(){
        var ctrl = cCtrl();
        expect(scope.destList.length).toEqual(0);
        scope.destination = "alma";
        expect(scope.getDestination()).toEqual("alma");
        scope.destList = ["korte", "szilva", "miegyeb"];
        scope.destListSelect = scope.destList[2];
        expect(scope.getDestination()).toEqual(scope.destList[2]);
    });

    it("Should check existence correctly", function(){
        var url = "users?sourceurl=alma&experimentName=korte",
            ctrl = cCtrl();
        scope.sourceURL = "alma";
        scope.experimentName = "korte";
        $httpBackend.whenGET(url)
            .respond(200, "userCode\trecords\nu1\t1\nu2\t2\n");
        scope.checkExistence();
        $httpBackend.expectGET(url);
        $httpBackend.flush();
        expect(responder.respond.calls.count()).toEqual(2);
        expect(responder.respond).toHaveBeenCalledWith("");
        expect(responder.respond).toHaveBeenCalledWith("<strong>Experiment exists.</strong> There are 2 users in the database.", "success");

        url += "&file=z";
        scope.destination = "z";
        $httpBackend.whenGET(url)
            .respond(200, "userCode\trecords\nu1\t1\n");
        scope.checkExistence();
        $httpBackend.expectGET(url);
        $httpBackend.flush();
        expect(responder.respond.calls.count()).toEqual(4);
        expect(responder.respond).toHaveBeenCalledWith("");
        expect(responder.respond).toHaveBeenCalledWith("<strong>Experiment exists.</strong> There are 1 users in the database.", "success");
    });

    it("Should make a correct download", function(done){
    // OK This wouldn't work on a browser without window.URL
    // Like PhantomJS. Do I want to have another way of downloading?
        var ctrl = cCtrl();
        var url = "makecsv?sourceurl=alma&experimentName=korte",
            resp = "this\tis\ta\theader\tuserCode\n1\t2\t3\t4\tUSX143\n";
        spyOn(FileSaver, "saveAs");
        $httpBackend.whenGET(url).respond(resp);
        scope.sourceURL = "alma";
        scope.experimentName = "korte";
        scope.getData();
        $httpBackend.expectGET(url);
        $httpBackend.flush();
        expect(responder.respond.calls.count()).toEqual(2);
        expect(responder.respond).toHaveBeenCalledWith("");
        expect(responder.respond).toHaveBeenCalledWith("<strong>Success!</strong> Data download should start right away.", "success");
        expect(FileSaver.saveAs).toHaveBeenCalled();
        var bl = FileSaver.saveAs.calls.mostRecent().args[0];
        var reader = new FileReader();
        reader.onloadend =  function(){
            expect(reader.result).toEqual(resp);
            done();
        };
        reader.readAsText(bl);
    });

    it("Should find destinations", function(){
        var ctrl = cCtrl();
        var url = "destinations?sourceurl=alma&experimentName=korte",
            resp = '["hajde.txt","hvadgordu.csv"]';
        $httpBackend.whenGET(url).respond(200, resp);
        scope.sourceURL = "alma";
        scope.experimentName = "korte";
        scope.findDestinations();
        $httpBackend.expectGET(url);
        $httpBackend.flush();
        expect(responder.respond.calls.count()).toEqual(2);
        expect(responder.respond.calls.mostRecent().args).toEqual(["Destination dropdown box populated", "success"]);
        expect(scope.destList.length).toEqual(2);
        expect(scope.destList.indexOf("hajde.txt")).toBeGreaterThan(-1);
        expect(scope.destList.indexOf("hvadgordu.csv")).toBeGreaterThan(-1);
    });
    
});



