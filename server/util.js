/** Utility tools for other modules
 * @module util
 */

var fnv = require("fnv-plus");

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
