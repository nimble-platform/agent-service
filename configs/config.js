var path = require('path');
var http = require('http');
var url = require('url');
var baseUrl = "http://localhost:8082";

module.exports = {
    'secret': '', //session encrypt key
    'publicFolderPath':path.dirname(require.main.filename) + '/public',
    'baseUrl':baseUrl + "/",
    'orgin':baseUrl,
    'port':8383,
    'mongoDb':"",
    "inProduction":false,
};
