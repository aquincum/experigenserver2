/*eslint-env node*/

/** Utility tools for other modules
 * @module
 */

var fnv = require("fnv-plus");
var fs = require("fs");
var commonutil = require("../commonutil");

for(f in commonutil){
    module.exports[f] = commonutil[f];
}

/**
 * Hashes the string. Now using FNV-1, returning the hexadecimal
 * representation.
 * Could be changed any time!
 * @param {string} wd Word/string/whatever to hash.
 * @returns {string} The hash in hexadecimal form.
 */
var hash = function hash(wd){
    return fnv.hash(wd, 52).hex();
};

module.exports.hash = hash;


/**
 * For logging events happening while running
 * @class
 */
module.exports.Logger = {
    /** The file to save */
    file: "experigenserver.log",
    /** Change the log file */
    setFile: function(f) {
        this.file = f;
    },
    /** Clear the log file */
    clear: function() {
        fs.unlink(this.file);
    },
    /** Log some message with timestamp */
    log: function(s){
        var msg = (new Date()).toString() + "\t" + s + "\n";
        fs.appendFileSync(this.file, msg);
    }
};

