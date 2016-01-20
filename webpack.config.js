var path = require("path");
var webpack = require("webpack");


var dir = function(d){
    return path.join(__dirname, d ? d : "");
};

var config =  {
    entry: "./app.js",
    output: {
        filename: "bundle.js",
        path: dir("public/dist/")
    },
    context: dir("public/js"),
    module: {
	loaders: [
	    {test: /\.css$/, loader: 'style!css'},
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.woff2$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=image/svg+xml" }
	]
    }
};



module.exports = config;
