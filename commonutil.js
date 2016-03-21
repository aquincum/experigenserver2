/*eslint-env node*/

/** Utility tools for all modules
 * @module
 */


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

/** Does the whole data to CSV deal
 * @param {Object} data The input data
 * @returns {String} The CSV string
 */
module.exports.toCSV = function(data){
    var fields = module.exports.getAllFieldNames(data);// to be impl
    var rv = fields.join("\t") + "\n"; // header
    data.forEach(function(line){
        rv += module.exports.formTSVLine(line, fields);
    });
    return rv;
};

