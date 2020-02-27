const agentValidations = require('../core/validations/sellingAgentValidations');
const CustomError = require('../core/exceptions/error')
const loggerWinston = require('../configs/logger');
var sellingAgentSchema = require('../core/models/SellingAgentSchema')
var buyingAgentSchema = require('../core/models/BuyingAgentSchema')
var randomstring = require("randomstring");


let AgentService = {

    createSellingAgent: (body) => {
        let sellingAgent = body;
        return new Promise((resolve, reject) => {
            agentValidations.validateCreateAgent(sellingAgent).then((validationResults) => {
                let agent = new sellingAgentSchema();
                agent.companyID = body.companyID;
                agent.id = randomstring.generate(12);
                agent.agentName = body.name;
                agent.maxContractAmount.value = body.maxContractAmount.value;
                agent.maxContractAmount.unit = body.maxContractAmount.unit;
                agent.maxFulfillmentTime.value = body.maxFulfillmentTime.value;
                agent.maxFulfillmentTime.unit = body.maxFulfillmentTime.unit;
                agent.minFulfillmentTime.value = body.minFulfillmentTime.value;
                agent.minFulfillmentTime.unit = body.minFulfillmentTime.unit;
                agent.maxVolume.value = body.maxVolume.value;
                agent.maxVolume.unit = body.maxVolume.unit;
                agent.maxNoOneToOne.value = body.maxNoOneToOne.value;
                agent.maxNoOneToOne.unit = body.maxNoOneToOne.unit;
                agent.productNames = body.productNames;
                agent.maxNoContractPerDay = body.maxNoContractPerDay;
                agent.noOfTransactions = 0;
                agent.lastActive = "-";
                agent.isActive = true;
                agent.isDeleted = false;

                agent.save(function (err, agentResults) {
                    if (err) {
                        loggerWinston.error('couldnt save selling agent', {error: err});
                        reject(new CustomError('could not save selling agent', err))
                    } else {
                        console.log(agentResults);
                        resolve(agentResults)
                    }
                });
            }).catch((err) => {
                loggerWinston.error('validate selling agent error', {error: err});
                reject(new CustomError('validate company details error', err))
            })
        })
    },

    createBuyingAgent: (body) => {
        let buyingAgent = body;
        return new Promise((resolve, reject) => {
            agentValidations.validateCreateAgent(buyingAgent).then((validationResults) => {
                let agent = new buyingAgentSchema();
                agent.companyID = body.companyID;
                agent.agentName = body.name;
                agent.maxContractAmount.value = body.maxContractAmount.value;
                agent.maxContractAmount.unit = body.maxContractAmount.unit;
                agent.maxFulfillmentTime.value = body.maxFulfillmentTime.value;
                agent.maxFulfillmentTime.unit = body.maxFulfillmentTime.unit;
                agent.minFulfillmentTime.value = body.minFulfillmentTime.value;
                agent.minFulfillmentTime.unit = body.minFulfillmentTime.unit;
                agent.maxVolume.value = body.maxVolume.value;
                agent.maxVolume.unit = body.maxVolume.unit;
                agent.maxNoOneToOne.value = body.maxNoOneToOne.value;
                agent.maxNoOneToOne.unit = body.maxNoOneToOne.unit;
                agent.productNames = body.productNames;
                agent.maxNoContractPerDay = body.maxNoContractPerDay;
                agent.noOfTransactions = 0;
                agent.lastActive = "-";
                agent.isActive = true;
                agent.isDeleted = false;

                agent.save(function (err, agentResults) {
                    if (err) {
                        loggerWinston.error('couldnt save selling agent', {error: err});
                        reject(new CustomError('could not save selling agent', err))
                    } else {
                        console.log(agentResults);
                        resolve(agentResults)
                    }
                });
            }).catch((err) => {
                loggerWinston.error('validate selling agent error', {error: err});
                reject(new CustomError('validate company details error', err))
            })
        })
    },


    editAgent: (config) => {

    },

    deleteAgent: () => {

    },

    getAllSellingAgents: (companyID) => {
        return new Promise((resolve, reject) => {
            sellingAgentSchema.find({companyID: companyID}).exec(function(err, agents){
                if(err) {
                    loggerWinston.error('couldnt get all selling agents', { error: err });
                    reject(new CustomError('couldnt get all selling agents', err))
                } else {
                    resolve(agents)
                }
            });
        })
    },

    getAllBuyingAgents: (companyID) => {
        return new Promise((resolve, reject) => {
            buyingAgentSchema.find({companyID: companyID}).exec(function(err, agents){
                if(err) {
                    loggerWinston.error('couldnt get all buying agents', { error: err });
                    reject(new CustomError('couldnt get all buying agents', err))
                } else {
                    resolve(agents)
                }
            });
        })
    },

    approveSelling: (processID) => {
        
    },
};

module.exports = AgentService;
