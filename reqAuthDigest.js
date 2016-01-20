/**
 * This is a common module used by the server AND the client.
 * @module
 */

var crypto = require("crypto");
var assert = require("assert");
var md5 = function md5(str, encoding){
  return crypto
    .createHash('md5')
    .update(str)
    .digest(encoding || 'hex');
};

// from passport-http
var nonce = function nonce(len) {
    var buf = [],
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[Math.random() * charlen | 0]);
  }

  return buf.join('');
};

module.exports.HA1 = function HA1(username, password){
    return md5(username + ":Experimenters:" + password);
};


module.exports.reqAuthDigest = function reqAuthDigest(uri, username, password, method, headers){
    var newheader = "";
    var auths = headers["www-authenticate"].split(" ");
    assert.equal(auths[0], "Digest");
    auths = auths.splice(1).join("").split(",");
    var authresp = {};
    console.log(authresp);
    for(var i = 0; i < auths.length; i++){
        var m = auths[i].match(/(.*)="(.*)"/);
        authresp[m[1]] = m[2];
    }
    assert.equal(authresp.realm, "Experimenters");
    authresp.username = username;
    authresp.uri = uri;
    authresp.cnonce = nonce(32);
    authresp.nc = "00000001";
    var ha1 = md5(authresp.username + ":" + authresp.realm + ":" + password);
    var ha2 = md5(method.toUpperCase() + ":" + authresp.uri);
    authresp.response = md5(ha1 + ":" + authresp.nonce + ":" + authresp.nc + ":" + authresp.cnonce + ":" + authresp.qop + ":" + ha2);
    auths = [];
    for(var param in authresp){
        auths.push(param + "=" + authresp[param]);
    }
    newheader = "Digest " + auths.join(", ");

    return newheader;
};

