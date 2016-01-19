
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

describe("ExperimentDownloadController", function(){
    var cCtrl, responder, scope, $httpBackend, $window, FileSaver;
    beforeEach(module("adminApp"));
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
        var url = "/users?sourceurl=alma&experimentName=korte",
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
        /* OK This wouldn't work on a browser without window.URL
         * Like PhantomJS. Do I want to have another way of downloading? */
        var ctrl = cCtrl();
        var url = "/makecsv?sourceurl=alma&experimentName=korte",
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
        var url = "/destinations?sourceurl=alma&experimentName=korte",
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






