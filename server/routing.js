var postVersion = function(req, res){
    if(process.env.npm_package_version){
	res.end(process.env.npm_package_version); // npm start
    }
    else {
	var pjson = require("./package.json");
	res.end(pjson.version); // node server.js
    }
};

var routes = {
    "/version" : postVersion
};



module.exports = function doRouting(server) {
    for(var path in routes){
	server.get(path, routes[path]);
    }
};
