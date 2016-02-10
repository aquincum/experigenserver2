var app = angular.module("adminApp", ["ngFileSaver"]);
require("../services/apiService")(app);
require("../services/authService")(app);
require("../services/responder")(app);
require("../controllers/ExperimenterController")(app);
require("../controllers/ExperimentDownloadController")(app);
require("../controllers/StatusController")(app);
require("../controllers/RegistrationController")(app);

module.exports = app;
