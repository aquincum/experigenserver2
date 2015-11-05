var http = require("http");
var express = require("express");
var doRouting = require("server/routing");
var argv = require("yargs").usage("Usage: $0 [options]")
	.default("p", 3000)
	.alias("p", "port")
	.nargs("p", 1)
	.describe("p", "Port number to run on")
	.string("p")
	.help("h")
	.alias("h", "help")
	.epilog("Daniel Szeredi (C) 2015")
	.argv;

/* ----------------------------------------------- */

var server = express();
//server.set("view engine", "ejs");
doRouting(server);



server.listen(parseInt(argv.p, 10));
