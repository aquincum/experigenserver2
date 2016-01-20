require("./phantomJSpolyfill");
var angular = require("angular");
var angularMocks = require("angular-mocks");
var angularFS = require("angular-file-saver");
var inject = angular.mock.inject;
require("../../public/js/modules/adminApp");

require("./test-angular");
require("./test-apiService");
require("./test-status");
require("./test-ExperimentDownloadController");
require("./test-ExperimenterController");





