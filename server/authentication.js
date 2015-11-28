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

var route = function(app){
    passport.use(new DigestStrategy(
        {qop: "auth"},
        function(username, done){
            db.findUser(username, function(err, user){
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
    //app.use(passport.authenticate(["digest", "anonymous"]));
    app.use(passport.initialize());
    app.use(passport.session());

    
    app.get("/me",
            passport.authenticate(['digest','anonymous'], { session: false }),
            function(req, res){
                res.end(req.user || "none");
            });
};


module.exports = {
    route: route
};
