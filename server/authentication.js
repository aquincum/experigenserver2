/*eslint-env node*/
/**
 * Functions for authentication
 * @module
 */

/*var login = function(req, res){
    
};*/


var passport = require("passport"),
    DigestStrategy = require("passport-http").DigestStrategy,
    LocalStrategy = require("passport-local").Strategy,
    AnonymousStrategy = require('passport-anonymous').Strategy;

var experimenterModel = require("./models/experimenter");

var HA1 = require("../reqAuthDigest").HA1;


/** The authentication middleware used in Express for
 * `digest` routes.
 */
var authenticateDigest = passport.authenticate.bind(passport, ["digest"]);

/** The authentication middleware used in Express for
 * `local` routes.
 */
var authenticateLocal = passport.authenticate.bind(passport, ["local"]);



/**
 * Called when starting up the server. It takes care of registering
 * passport.js middleware, and set up routing for authentication.
 * Note: the password stored is an object with an "ha1" key, which
 * is passed to passport-http. It knows what to do with it.
 * @param {Server} app The Express application
 * @param {String} path A path to set the middleware up on. 
 */
var setup = function(app){
    /*app.use(function(req, res, next){
        if(req.headers && req.headers.authorization && req.headers.authorization.search(/sourceurl/)){
            var ats = req.headers.authorization.split("&");
            var newats = ats.map(function(s){
                var eqs = s.split("=");
                if(eqs[0] == "sourceurl"){
                    eqs[1] = encodeURIComponent(eqs[1]);
                    return eqs.join("=");
                }
                else {
                    return s;
                }
            });
            req.headers.authorization = newats.join("&");
            console.log("IM HERE",req.headers.authorization);
        }
        next();
    });*/
    passport.use(new DigestStrategy(
        {qop: "auth",
         realm: "Experimenters"},
        function(username, done){
            experimenterModel.findExperimenter(username).then(function(user){
                if (!user) {
                    done(null, false);
                }
                else {
                    done(null, user, user.password);
                }
            }).catch(function(err){
                done(err);
            });
        },
        function(params, done) {
            // validate nonces as necessary (?)
            done(null, true);
        }
    ));
    passport.use(new AnonymousStrategy());
    passport.use(new LocalStrategy({
        usernameField: "experimenter",
        passwordField: "password"
        },  function(experimenter, password, done){
            console.log("Here we go!");
            console.log("Arguments", arguments);
            experimenterModel.findExperimenter(experimenter).then(function(user){
                console.log("User:", user);
                if(!user){
                    done(null, false);
                }
                else if (user.password.ha1 !== HA1(experimenter, password)) {
                    done(null, false);
                }
                else {
                    done(null, user);
                }
            }).catch(function(err){
                done(err);
            })
        }
    ));


    passport.serializeUser(function(user, done) {
        done(null, user.username);
    });

    passport.deserializeUser(function(user, done) {
        experimenterModel.findExperimenter().then(function(found){
            done(null, found);
        }).catch(function(err){
            done(err);
        });
    });

    app.use(passport.initialize());
    app.use(passport.session());
    //app.use(passport.authenticate(["digest", "anonymous"]));
};


module.exports = {
    setup: setup,
    authenticateDigest: authenticateDigest,
    authenticateLocal: authenticateLocal
};
