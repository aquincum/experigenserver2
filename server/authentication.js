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

var experimenterModel = require("./models/experimenter");


/** The authentication middleware used in Express
 */
var authenticate = passport.authenticate.bind(passport, ["digest"]);


/**
 * Called when starting up the server. It takes care of registering
 * passport.js middleware, and set up routing for authentication.
 * Note: the password stored is an object with an "ha1" key, which
 * is passed to passport-http. It knows what to do with it.
 * @param {Server} app The Express application 
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
    authenticate: authenticate
};
