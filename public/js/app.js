var version = "yay";
var jQuery = require("jquery");
window.jQuery = jQuery; // aah, have to calm bootstrap down.
var angular = require("angular");
var angularFS = require("angular-file-saver");
var bootstrap = require("bootstrap-webpack!../../bootstrap.config.js");


var app = require("./modules/adminApp");
