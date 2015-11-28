/*eslint-env node*/

var express = require("express");
var routing = require("./server/routing");
var argv = require("yargs").usage("Usage: $0 [options]")
    .alias("p", "port")
    .nargs("p", 1)
    .describe("p", "Port number to run on. By default, the PORT environment variable will be used, or if that is not set, the default is 3000.")
    .string("p")
    .boolean("e")
    .alias("e", "emulate")
    .describe("e", "Emulate the behavior of the Perl 1.0 server by serving .cgi as well")
    .help("h")
    .alias("h", "help")
    .describe("h", "Print this help screen")
    .epilog("Daniel Szeredi (C) 2015")
    .argv;

/* ----------------------------------------------- */

var server = express();
routing.route(server, argv.e);
server.use(express.static("public", {
    extensions: ["html"]
}));

var port = argv.p || process.env.PORT || 3000;
server.listen(parseInt(port, 10), function(err, res){
    console.log("Listening on " + port + ".");
});
