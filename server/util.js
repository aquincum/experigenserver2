/*eslint-env node*/

/** Utility tools for other modules
 * @module
 */

var fnv = require("fnv-plus");
var fs = require("fs");


/**
 * Goes through all the objects in an array, and collects all the field
 * names that occur in them
 * @param {Object[]} data The list of data
 * @returns {string[]} The names of fields
 */
module.exports.getAllFieldNames = function(data){
    var fieldlist = [];
    data.forEach(function(elem){
        for(var f in elem){
            if(fieldlist.indexOf(f) === -1){
                fieldlist.push(f);
            }
        }
    });
    return fieldlist;
};


/**
 * Returns a string that is a line for the given dataset, in the order of fields
 * specified in the fields array. Fields separated by tabs. (Yes.)
 * @param {Object} o The object to lineify
 * @param {string[]} fields Field names (order matters!)
 * @returns {string} The lineified string
 */
module.exports.formTSVLine = function(o, fields){
    var vals = [];
    fields.forEach(function(fieldname){
        if(o[fieldname]){
            vals.push(o[fieldname]);
        }
        else {
            vals.push("");
        }
    });
    return (vals.join("\t") + "\n");
};


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

