var path = require('path');
var baseUrl = process.env.AGENT_BASE_URL;

module.exports = {
    'secret': 'ASD#DDdjjdjdfdss', //session encrypt key
    'publicFolderPath':path.dirname(require.main.filename) + '/public',
    'baseUrl':baseUrl,
    'port':process.env.AGENT_PORT,
    'mongoDb': process.env.AGENT_DB,
    "inProduction":false,
    "bearer": process.env.AGENT_TOKEN,
    "federationID": "STAGING"
};
