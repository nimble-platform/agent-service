const agentValidations = require('../core/validations/sellingAgentValidations');
const CustomError = require('../core/exceptions/error');
const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const saOrderApproved = require('../core/models/OrdersApprovedSA');
const baOrderInitiated = require('../core/models/OrdersInitiatedBA');
const request = require('request');
const DBService = require('./DBService');
const agentHelper = require('./agentHelper');
const buyerOrderSchema = require('../core/models/BuyerOrderSchema');
const cron = require("node-cron");

let AgentService = {

    createSellingAgent: (body) => {
        return new Promise((resolve, reject) => {
            agentValidations.validateCreateAgent(body).then((validationResults) => {
                let agent = agentHelper.generateSAForForm(body, true);
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
        return new Promise((resolve, reject) => {
            agentValidations.validateCreateAgent(body).then((validationResults) => {
                let agent = agentHelper.generateBAForForm(body, true);
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
            let agent = agentHelper.generateSAForForm(body, false);
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
            let agent = agentHelper.generateBAForForm(body, false);
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

    updateLastActiveTime: (id, agentType) => {
        return new Promise((resolve, reject) => {

            let d = new Date();
            let dformat = [d.getMonth()+1,
                        d.getDate(),
                        d.getFullYear()].join('/')+' '+
                    [d.getHours(),
                        d.getMinutes(),
                        d.getSeconds()].join(':');

            let query = {id: id};
            let param = {
                $set: {lastActive: dformat}
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

    getSAOrders: ((agentID) => {
        return new Promise((resolve, reject) => {
            saOrderApproved.find({agentID: agentID}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all selling agents', {error: err});
                    reject(new CustomError('couldnt get all selling agents', err))
                } else {
                    resolve(agent)
                }
            });
        })
    }),

    getBAOrders: ((agentID) => {
        return new Promise((resolve, reject) => {
            baOrderInitiated.find({agentID: agentID}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all buying agents', {error: err});
                    reject(new CustomError('couldnt get all buying agents', err))
                } else {
                    resolve(agent)
                }
            });
        })
    }),


    getSAStatus: ((processID) => {
        return new Promise((resolve, reject) => {
            saOrderApproved.find({"payload.processData.processInstanceID": processID}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all buying agents', {error: err});
                    reject(new CustomError('couldnt get all buying agents', err))
                } else {
                    resolve(agent)
                }
            });
        })
    }),


    getBAStatus: ((processID) => {
        return new Promise((resolve, reject) => {
            baOrderInitiated.find({"payload.processData.processInstanceID": processID}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all buying agents', {error: err});
                    reject(new CustomError('couldnt get all buying agents', err))
                } else {
                    resolve(agent)
                }
            });
        })
    }),


    notifyAgent: (async (buyData) => {
        return new Promise((resolve, reject) => {
            if(buyData['processData']['processID'] === "Order"){
                let partyID = buyData['sellerSupplierParty']['party']['partyIdentification'][0]['id'];
                let productID = buyData['orderLine'][0]['lineItem']['item']['manufacturersItemIdentification']['id'];
                let epochTime = agentHelper.getCurrentEpochTime();

                agentHelper.getAssociatedSellingAgent(partyID, productID).then((sellingAgent) => {
                    if (sellingAgent !== undefined) {
                        // save the configurations to the data base
                        let buyDataSchema = new buyerOrderSchema();
                        buyDataSchema.id = buyData.id;
                        buyDataSchema.payload = buyData;
                        buyDataSchema.timeStamp = epochTime;
                        buyDataSchema.agentID = sellingAgent.id;

                        // Compute the next execution time
                        buyDataSchema.nextTime = agentHelper.computeExecutionTime(epochTime, sellingAgent['minFulfillmentTime']['value'],
                            sellingAgent['minFulfillmentTime']['unit']);

                        buyDataSchema.nextMaxTime = agentHelper.computeExecutionTime(epochTime, sellingAgent['maxFulfillmentTime']['value'],
                            sellingAgent['maxFulfillmentTime']['unit']);

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
            }else {
                resolve({msg: 'Negotiations are not supported by the agents'});
            }
        });
    }),


    startSellAgentProcessing: (() => {
        // Get all the requests for processing
        buyerOrderSchema.find({nextTime: {$lt: agentHelper.getCurrentEpochTime()}}).exec(function (err, orders) {
            if (err) {
                loggerWinston.error('couldnt get all selling agents', {error: err});
                reject(new CustomError('couldnt get all selling agents', err))
            } else {
                orders.forEach((order) => {

                    agentHelper.getSellingAgent(order.agentID).then((agents) => {
                        if (agents.length !== 0) {
                            let agent = agents[0].toJSON();
                            // Check if the agent is active
                            if (agent.isActive) {
                                // let url = `${configs.baseUrl}/business-process/document/json/${documentID}`;
                                order = order.toJSON();
                                let processID = order['payload']['processData']['processInstanceID'];
                                let options = {
                                    url: `${configs.baseUrl}/business-process/processInstance/${processID}/details?delegateId=STAGING`,
                                    headers: {
                                        Authorization: configs.bearer
                                    }
                                };

                                request(options, function (err, res, body) {
                                    if (err) {
                                        console.log('Error :', err);
                                        return
                                    }
                                    let response = JSON.parse(body);
                                    if (response.processInstanceState === 'ACTIVE') {
                                        options.url = `${configs.baseUrl}/business-process/process-document`;
                                        options.body = JSON.stringify(agentHelper.createSellApprovalRequest(order));

                                        let isUnderLimit = agentHelper.checkIfUnderTheTransactionLimit(order, agent).then(() => {
                                            request.post(options, function (processDocErr, processDocRes, processDocBody) {
                                                if (err) {
                                                    console.log('Error occurred while processing the request :', processDocErr);
                                                    return
                                                }
                                                let processDocResponse = JSON.parse(processDocBody);
                                                if (processDocResponse.status === 'COMPLETED') {
                                                    console.log(`The order has been successfully processed : ${order.id}`);
                                                    agentHelper.deleteOrderRequest(order.id);
                                                    order['payload']['processData']['processInstanceID'] == 'COMPLETED';
                                                    agentHelper.addToSAProcessedOrder(order);
                                                    agentHelper.incrementSAOrderCount(agent.id);
                                                    // update number of transactions
                                                }
                                            })
                                        }).catch((err) => {
                                            if (err.code === 1000) {
                                                agentHelper.deleteOrderRequest(order.id);
                                            }
                                        })
                                    } else {
                                        // delete from the order processing list
                                        agentHelper.deleteOrderRequest(order.id);
                                    }
                                })
                            }
                        }
                    });
                });
            }
        });
    }),
};


cron.schedule("*/30 * * * *", function() {
    AgentService.startSellAgentProcessing();
});

module.exports = AgentService;
