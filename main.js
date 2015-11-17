var http = require("http");
var express = require("express");
var routing = require("./server/routing");
var argv = require("yargs").usage("Usage: $0 [options]")
    .default("p", 3000)
    .alias("p", "port")
    .nargs("p", 1)
    .describe("p", "Port number to run on")
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
//server.set("view engine", "ejs");
routing.route(server, argv.e);



server.listen(parseInt(argv.p, 10));
