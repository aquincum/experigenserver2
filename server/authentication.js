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



/**
 * Called when starting up the server. It takes care of registering
 * passport.js middleware, and set up routing for authentication.
 * @param app The Express application 
 */
var route = function(app){
    passport.use(new DigestStrategy(
        {qop: "auth"},
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
    app.use(passport.authenticate(["digest", "anonymous"]));
    app.use(passport.initialize());
    app.use(passport.session());

    
    app.get("/me",
            function(req, res){
                res.end(req.user || "none");
            });

    app.get("/experimenter", function(req, res){
        db.findExperimenter(req.query.experimenter, function(err, doc){
            if(err){
                res.end(err);
            }
            else{
                if(!doc){
                    res.status(404).end("none");
                }
                res.status(200).end(doc.username);
            }
        });
    });
    app.post("/experimenter", function(req, res){
        db.insertExperimenter(req.query.experimenter, req.query.password, function(err){
            if(err){
                if(err=="conflict"){
                    res.status(409);
                }
                res.end(err);
            }
            else {
                res.status(200).end("done");
            }
        });
    });
    app.put("/experimenter", function(req, res){
        if(req.user.username !== req.experimenter){
            return res.status(403).end("not authorized");
        }
        db.updateExperimenter(req.query.experimenter, req.query.password, function(err){
            if(err){
                if(err=="not found"){
                    res.status(404);
                }
                res.end(err);
            }
            else {
                res.status(200).end("done");
            }
        });
    });
    app.delete("/experimenter", function(req, res){
        if(req.user.username !== req.query.experimenter){
            return res.status(403).end("not authorized");
        }
        db.deleteExperimenter(req.experimenter, function(err){
            if(err){
                if(err=="not found"){
                    res.status(404);
                }
                res.end(err);
            }
            else {
                res.status(200).end("done");
            }
        });
    });
    
};


module.exports = {
    route: route
};
