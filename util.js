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
