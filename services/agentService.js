const agentValidations = require('../core/validations/sellingAgentValidations');
const CustomError = require('../core/exceptions/error')
const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema')
const buyingAgentSchema = require('../core/models/BuyingAgentSchema')
const randomstring = require("randomstring");
const request = require('request');
const DBService = require('./DBService');
const agentHelper = require('./agentHelper');
const buyerOrderSchema = require('../core/models/BuyerOrderSchema');


// TODO Experimental for DEV
const buyData = require('../core/data/firstOrder')

// const checkIfValidPayment = ((qty, value, id, agent, dailyLimit, currentLimit) => {
//
// });

const getDocument = (documentID, bearerToken) => {
    let options = {
        url: `http://nimble-staging.salzburgresearch.at/business-process/document/json/${documentID}`,
        headers: {
            Authorization: bearerToken
        }
    };

    request(options, function (err, res, body) {
        if (err) {
            console.log('Error :', err);
            return
        }

        let response = JSON.parse(body);
        let lineItem = response.orderLine[0].lineItem;
        let qty = lineItem.quantity.value;
        let price = lineItem.price.priceAmount.value;
        let id = lineItem.item.manufacturersItemIdentification.id;
    });

};


function getProcessGroupData(processID, bearerToken) {
    var options = {
        url: `http://nimble-staging.salzburgresearch.at/business-process/processInstance/${processID}/details?delegateId=STAGING`,
        headers: {
            Authorization: bearerToken
        }
    };

    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
            if (err) {
                console.log('Error :', err);
                return
            }
            let response = JSON.parse(body)
            let documentID = response.requestMetadata.documentID
            let status = response.requestMetadata.status

            if (status === 'WAITINGRESPONSE') {
                options.url = `http://nimble-staging.salzburgresearch.at/business-process/document/json/${documentID}`
            }
        })
    });
}

// getProcessGroupData("1884588", configs.token);


const generateBAForForm = (body, isNew) => {
    let agent = new sellingAgentSchema();
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
    if (isNew) {
        agent.id = randomstring.generate(12);
        agent.companyID = body.companyID;
        agent.noOfTransactions = 0;
        agent.lastActive = "-";
        agent.isActive = true;
        agent.isDeleted = false;
    } else if (isNew) {
        agent.id = body.id;
    }
    return agent;
};


const generateSAForForm = (body, isNew) => {
    let agent = new sellingAgentSchema();
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
    if (isNew) {
        agent.id = randomstring.generate(12);
        agent.companyID = body.companyID;
        agent.noOfTransactions = 0;
        agent.lastActive = "-";
        agent.isActive = true;
        agent.isDeleted = false;
    } else {
        agent.id = body.id;
    }
    return agent;
};

let AgentService = {

    createSellingAgent: (body) => {
        let sellingAgent = body;
        return new Promise((resolve, reject) => {
            agentValidations.validateCreateAgent(sellingAgent).then((validationResults) => {
                let agent = generateSAForForm(body, true);
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
                let agent = generateBAForForm(body, true);
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

    updateSellingAgent: (body) => {
        return new Promise((resolve, reject) => {
            let agent = generateSAForForm(body, false);
            var upsertData = agent.toObject();
            delete upsertData._id;
            sellingAgentSchema.update({id: agent.id}, upsertData, {upsert: true}, function (err, agent) {
                if (err) {
                    reject(error);
                }
                console.log("agent update completed")
                resolve(agent);
            });
        });
    },

    updateBuyingAgent: (body) => {
        return new Promise((resolve, reject) => {
            let agent = generateBAForForm(body, false);
            var upsertData = agent.toObject();
            delete upsertData._id;
            buyingAgentSchema.update({id: agent.id}, upsertData, {upsert: true}, function (err, agent) {
                if (err) {
                    reject(error);
                }
                console.log("agent update completed")
                resolve(agent);
            });
            resolve();
        });
    },

    deleteAgent: (id, agentType) => {
        return new Promise((resolve, reject) => {
            let query = {id: id};
            let param = {
                $set: {isDeleted: true}
            };
            DBService.upDateAgentAttribute(id, agentType, query, param).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        });
    },

    deactivateAgent: (id, agentType) => {
        return new Promise((resolve, reject) => {
            let query = {id: id};
            let param = {
                $set: {isActive: false}
            };
            DBService.upDateAgentAttribute(id, agentType, query, param).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        });
    },

    activateAgent: (id, agentType) => {
        return new Promise((resolve, reject) => {
            let query = {id: id};
            let param = {
                $set: {isActive: true}
            };
            DBService.upDateAgentAttribute(id, agentType, query, param).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        });
    },

    getAllSellingAgents: (companyID) => {
        return new Promise((resolve, reject) => {
            sellingAgentSchema.find({companyID: companyID, isDeleted: false}).exec(function (err, agents) {
                if (err) {
                    loggerWinston.error('couldnt get all selling agents', {error: err});
                    reject(new CustomError('couldnt get all selling agents', err))
                } else {
                    resolve(agents)
                }
            });
        })
    },

    getSellingAgent: (id) => {
        return new Promise((resolve, reject) => {
            sellingAgentSchema.find({id: id}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all selling agents', {error: err});
                    reject(new CustomError('couldnt get all selling agents', err))
                } else {
                    resolve(agent)
                }
            });
        })
    },

    getAllBuyingAgents: (companyID) => {
        return new Promise((resolve, reject) => {
            buyingAgentSchema.find({companyID: companyID, isDeleted: false}).exec(function (err, agents) {
                if (err) {
                    loggerWinston.error('couldnt get all buying agents', {error: err});
                    reject(new CustomError('couldnt get all buying agents', err))
                } else {
                    resolve(agents)
                }
            });
        })
    },

    getAssociatedSellingAgent: (companyID, productID) => {
        let sellingAgent;
        return new Promise(async (resolve, reject) => {

            sellingAgentSchema.find({companyID: companyID}).exec(function (err, agents) {
                if (err) {
                    loggerWinston.error('couldn\'t get the selling agents', {error: err});
                    reject(new CustomError('couldn\'t get the selling agents', err))
                } else {

                    for (let i = 0; i < agents.length; i++) {
                        let agent = agents[i];
                        for (let j = 0; j < agent.productNames.length; j++) {
                            let pID = agent.productNames[j];
                            if (pID === productID && agent.isActive === true) {
                                sellingAgent = agent;
                                break;
                            }
                        }
                        // Found the appropriate agent for selling
                        if (sellingAgent !== undefined) {
                            break;
                        }
                    }
                }
            });

            resolve(sellingAgent);
        });
    },


    notifyAgent: ((buyData) => {
        return new Promise((resolve, reject) => {
            let partyID = buyData['sellerSupplierParty']['partyIdentification'][0]['id'];
            let productID = orderLine[0]['lineItem']['manufacturersItemIdentification']['id'];
            let epochTime = Math.round((new Date()).getTime() / 1000);

            this.getAssociatedSellingAgent(partyID, productID).then((agentID) => {
                if (agentID !== undefined) {
                    // save the configurations to the data base
                    let buyDataSchema = new buyerOrderSchema();
                    buyDataSchema.id = buyData.id;
                    buyDataSchema.payload = buyData;
                    buyDataSchema.timeStamp = epochTime;

                    // Compute the next execution time

                    buyDataSchema.save(function (err, agentResults) {
                        if (err) {
                            loggerWinston.error('couldnt save the buying data configs', {error: err});
                            reject({msg: 'couldnt save the buying data configs'});
                        } else {
                            resolve({msg: 'found an associated agent!'});
                        }
                    });
                } else {
                    resolve({msg: 'could not find an associated agent'})
                }
            }).catch((err) => {
                reject(err);
            })
        });
    }),


    startSellAgentProcessing: (() => {
        // Get all the requests for processing

        // For each request check if the status of the product has changed

        // For Each request check if it can be processed via time stamp

        // check if the volume limit has exceeded from processed payments

        // If all okay, start approving the Item
        this.getSellingAgent().then((agent) => {

        }).catch(err => {

        })
    })
};

// AgentService.approveSelling("50916");


const checkIFAgentExitsForProduct = (async (partyID, productID) => {


});

module.exports = AgentService;
