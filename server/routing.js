var db = require("./db");

var postVersion = function(req, res){
    if(process.env.npm_package_version){
	res.end(process.env.npm_package_version); // npm start
    }
    else {
	var pjson = require("./package.json");
	res.end(pjson.version); // node server.js
    }
};

var getUserID = function(req, res){
    var html = req.query.sourceurl,
	expname = req.query.experimentName;
    if(!html || !expname) {
	res.end("(\"0\")");
    }
    else {
	db.getUserFileName(html, expname, function (ufn){
	    res.end("(\"" + ufn.toString() + "\")");
	});
    }
};

var routes = {
    "/version" : postVersion,
    "/getuserid" : getUserID
};



module.exports = function doRouting(server) {
    for(var path in routes){
	server.get(path, routes[path]);
    }
};
