/** Utility tools for other modules
 * @module util
 */

var fnv = require("fnv-plus");


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
	    if( fieldlist.indexOf(f) === -1){
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
 * Cleans up the URL based on the old Experigen ways. Might switch it
 * off at some point but it's fine for now.
 * @param {string} htmlSource The source URL as passed on by the client.
 * @returns {string} The cleaned URL
 */
module.exports.cleanURL = function(htmlSource){
    var res = encodeURIComponent(htmlSource); // URL encoding
    // Sticking to the old ways for now
    var matches = res.match(/^([A-Za-z0-9\.\%\~\!\*\(\)\']+)$/);
    // TODO: test problems?
    res = matches[0];
    res = res.replace(/^http%3A%2F%2F/, ""); // http://
    res = res.replace(/%2F$/, ""); // final /
    res = res.replace(/(%3A|%2F)/g, "."); // http://
    res = res.replace(/(%7E|~)/g, "");
    return res;
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
 * Creates a (hopefully) unique collection name based on the experiment
 * name and the source HTML. Uses the {@link module:util~hash} function inside.
 * @param {string} sourceHtml The source HTML
 * @param {string} experimentName The experiment name
 * @returns {string} The unique identifier.
 */
module.exports.createCollectionName = function(sourceHtml, experimentName){
    return "exp" + hash(sourceHtml) + hash(experimentName);
};
