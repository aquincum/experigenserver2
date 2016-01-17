#!/usr/bin/node

var database = require("../server/db");
var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Are you sure you want to clear most of this database? (yes/no) > ", function(answer){
    if(answer === "yes"){
        console.log("Okay, clearing...");
        doClear();
    }
    else {
        console.log("Okay, no harm done.");
        process.exit();
    }
});


function doClear(){
    database.getDB().then(function(db){
        process.stdout.write('.');
        return db.collections();
    }).then(function(colls){
        process.stdout.write('.');
        var removePs = colls.map(function(coll){
            if(coll.collectionName.match(/^exp/) && coll.collectionName !== "experimenters"){
                process.stdout.write('.');
                return coll.drop();
            }
            else if (coll.collectionName === "experimenters" ||
                     coll.collectionName === "registration"){
                process.stdout.write('.');
                return coll.remove();
            }
            else{
                return Promise.resolve(false);
            }
        });
        return Promise.all(removePs);
    }).then(function(results){
        process.stdout.write('.');
        var rems = results.reduce(function(a,s) {
            return a+(!!s);
        }, 0);
        console.log("Removed", rems-2, "experiments.");
        process.exit();
    });
}
