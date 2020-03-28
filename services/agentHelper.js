const agentValidations = require('../core/validations/sellingAgentValidations');
const CustomError = require('../core/exceptions/error')
const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema')
const buyingAgentSchema = require('../core/models/BuyingAgentSchema')
const randomstring = require("randomstring");
const request = require('request');
const DBService = require('./DBService')

let AgentHelper = {
    upDateAgentAttribute: (id, agentType, attributeName, AttributeValue) => {

        return new Promise((resolve, reject) => {

            let agentSchema = null;
            if (agentType === 'SELLING_AGENT') {
                agentSchema = sellingAgentSchema;
            }else if (agentSchema === 'BUYING_AGENT') {
                agentSchema = buyingAgentSchema;
            }

            if (agentSchema == null) {
                reject({msg: "Invalid agent type"})
            }

            agentSchema.update({
                id: id
            }, {
                $set: {
                    attributeName: AttributeValue
                }
            }, function (err, agent) {
                if (err) {
                    reject(error);
                }
                console.log("agent update completed")
                resolve(agent);
            });
        });
    },

    generateUUID: () => {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
};


module.exports = AgentHelper;
