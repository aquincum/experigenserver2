var assert = require("assert");
var routing = require("../routing");

// let's do this
/* first */
describe("Routing", function(){
    it("Should route to functions to responses", function(){
	var mockServer = {
	    get: function(path, func){
		assert.equal(typeof func, "function");
	    }
	};
	routing(mockServer);
    });
});
