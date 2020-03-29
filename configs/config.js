var path = require('path');
var baseUrl = "http://nimble-staging.salzburgresearch.at";

module.exports = {
    'secret': 'ASD#DDdjjdjdfdss', //session encrypt key
    'publicFolderPath':path.dirname(require.main.filename) + '/public',
    'baseUrl':baseUrl,
    'port':8383,
    'mongoDb':"",
    "inProduction":false,
    "token": "",
    "bearer": ""
};
