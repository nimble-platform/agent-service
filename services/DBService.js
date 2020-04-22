const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
var sellingAgentSchema = require('../core/models/SellingAgentSchema')
var buyingAgentSchema = require('../core/models/BuyingAgentSchema')

let DBService = {

    upDateAgentAttribute: (id, agentType, query, param) => {

        return new Promise((resolve, reject) => {

            let agentSchema = null;
            if (agentType === 'SELLING_AGENT') {
                agentSchema = sellingAgentSchema;
            }else if (agentType === 'BUYING_AGENT') {
                agentSchema = buyingAgentSchema;
            }

            if (agentSchema == null) {
                reject({msg: "Invalid agent type"})
            }

            agentSchema.update(query, param, function (err, agent) {
                if (err) {
                    reject(error);
                }
                console.log("agent update completed");
                resolve(agent);
            });
        });
    },
};

module.exports = DBService;
