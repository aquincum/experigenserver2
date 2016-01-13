/**
 * Posts the version of the server to the client.
 * Route is /version
 */
var postVersion = function(req, res){
    if(process.env.npm_package_version){
        res.end(process.env.npm_package_version); // npm start
    }
    else {
        var pjson = require("../../package.json");
        res.end(pjson.version); // node server.js
    }
};
module.exports = postVersion;
