/*eslint-env node*/
/**
 * Functions for authentication
 * @module
 */

/*var login = function(req, res){
    
};*/

// Strategy: digest

var passport = require("passport"),
    DigestStrategy = require("passport-http").DigestStrategy,
    AnonymousStrategy = require('passport-anonymous').Strategy;

var db = require("./db");

var authenticate = passport.authenticate.bind(passport, ["digest"]);



/**
 * Called when starting up the server. It takes care of registering
 * passport.js middleware, and set up routing for authentication.
 * Note: the password stored is an object with an "ha1" key, which
 * is passed to passport-http. It knows what to do with it.
 * @param {Server} app The Express application 
 */
var setup = function(app){
    passport.use(new DigestStrategy(
        {qop: "auth",
         realm: "Experimenters"},
        function(username, done){
            db.findExperimenter(username, function(err, user){
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                return done(null, user, user.password);
            });
        },
        function(params, done) {
            // validate nonces as necessary (?)
            done(null, true);
        }
    ));
    passport.use(new AnonymousStrategy());


    passport.serializeUser(function(user, done) {
        done(null, user.username);
    });

    passport.deserializeUser(function(user, done) {
        db.findExperimenter(user, done);
    });

    app.use(passport.initialize());
    app.use(passport.session());
    //app.use(passport.authenticate(["digest", "anonymous"]));
};


module.exports = {
    setup: setup,
    authenticate: authenticate
};
