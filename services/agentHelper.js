const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const buyerOrderSchema = require('../core/models/BuyerOrderSchema');
const saOrderApproved = require('../core/models/OrdersApprovedSA');
const randomstring = require("randomstring");
const utils = require("./util");


function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

const getSellingAgent = ((id) => {
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
});


const getOrders = ((id, lt, gt) => {
    return new Promise((resolve, reject) => {
        saOrderApproved.find({agentID: id, timeStamp: {$lt: lt, $gt: gt}}).exec(function (err, agent) {
            if (err) {
                loggerWinston.error('couldnt get all selling agents', {error: err});
                reject(new CustomError('couldnt get all selling agents', err))
            } else {
                resolve(agent)
            }
        });
    })
});

let AgentHelper = {

    getSAOrders: ((agentID) => {
        return new Promise((resolve, reject) => {
            saOrderApproved.find({agentID: id}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all selling agents', {error: err});
                    reject(new CustomError('couldnt get all selling agents', err))
                } else {
                    resolve(agent)
                }
            });
        })
    }),

    getAssociatedSellingAgent: (companyID, productID) => {
        let sellingAgent;
        return new Promise(async (resolve, reject) => {

            sellingAgentSchema.find({companyID: companyID}).exec(function (err, agents) {
                if (err) {
                    loggerWinston.error('couldn\'t get the selling agents', {error: err});
                    reject(new CustomError('couldn\'t get the selling agents', err))
                } else {

                    for (let i = 0; i < agents.length; i++) {
                        let agent = agents[i].toJSON();
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

                    resolve(sellingAgent);
                }
            });
        });
    },

    computeExecutionTime: ((epochTime, value, unit) => {
        let time = epochTime;
        if (unit === 'hour') {
            time += value * 3600
        }else if (unit === 'day') {
            time += value * 86400
        }else if (unit === 'week') {
            time += value * 604800
        }
        return time;
    }),

    getCurrentEpochTime: (() => {
        return Math.round((new Date()).getTime() / 1000);
    }),

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

    createSellApprovalRequest: ((data) => {
        return req = {
            id: generateUUID(),
            note: [],
            rejectionNote: '',
            acceptedIndicator: true,
            orderReference: {
                documentReference: {
                    id: data.id,
                    documentType: null,
                    attachment: null
                }
            },
            sellerSupplierParty: data['payload']['sellerSupplierParty'],
            buyerCustomerParty: data['payload']['buyerCustomerParty'],
            additionalDocumentReference: []
        };
    }),

    deleteOrderRequest: ((id)=>{
        return new Promise((resolve, reject) => {
            buyerOrderSchema.deleteOne({ id: id }, function(err) {
                if (err) {
                    reject({msg: `error when deleting the record: ${id}`})
                }else {
                    resolve({msg: `Successfully deleted the record: ${id}`})
                }
            });
        });
    }),

    addToSAProcessedOrder: ((orderData) => {
        return new Promise((resolve, reject) => {
            let dataScheme = new saOrderApproved();
            dataScheme.id = orderData.id;
            dataScheme.payload = orderData.payload;
            dataScheme.timeStamp = utils.getCurrentEpochTime();
            dataScheme.agentID = orderData.agentID;


            dataScheme.save(function (err, agentResults) {
                if (err) {
                    loggerWinston.error('error when persisting the new order', {error: err});
                    reject({msg: 'error when persisting the new order'});
                } else {
                    resolve({msg: 'persisted the new order'});
                }
            });
        });
    }),


    getSAProcessedOrder: ((agentID) => {
        return new Promise((resolve, reject) => {

            saOrderApproved.find({agentID: agentID}).exec(function (err, agent) {
                if (err) {
                    loggerWinston.error('couldnt get all selling agents', {error: err});
                    reject(new CustomError('couldnt get all selling agents', err))
                } else {
                    resolve(agent)
                }
            });

            let dataScheme = new saOrderApproved();
            dataScheme.id = orderData.id;
            dataScheme.payload = orderData;
            dataScheme.timeStamp = orderData.timeStamp;
            dataScheme.agentID = orderData.agentID;


            dataScheme.save(function (err, agentResults) {
                if (err) {
                    loggerWinston.error('error when persisting the new order', {error: err});
                    reject({msg: 'error when persisting the new order'});
                } else {
                    resolve({msg: 'persisted the new order'});
                }
            });
        });
    }),

    generateSAForForm : (body, isNew) => {
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
    },

    generateBAForForm: (body, isNew) => {
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
    },

    checkIfUnderTheTransactionLimit: ((order, agent) => {
        return new Promise((resolve, reject) => {

            // check if max time has exceeded
            let currentTime = utils.getCurrentEpochTime();

            if (order.nextMaxTime < currentTime) {
                reject({code: 1000, msg: `max timer has been breached for order id ${order.id}`});
                return
            }

            if (agent.maxContractAmount.value < Number(order.payload.anticipatedMonetaryTotal.payableAmount.value)) {
                reject({code: 1003, msg: `maxContractAmount has been breached for order id ${order.id}`});
                return;
            }

            // check if daily contract limit has exceeded
            getOrders(order.agentID, utils.getToNightTimeStamp(), utils.getTodayMorningTimeStamp()).then((saOrders) => {
                let orderPerDay = saOrders.length;
                if (!(orderPerDay < Number(agent.maxNoContractPerDay))) {
                    reject({code: 1001, msg: `maxNoContractPerDay has been breached for order id ${order.id}`});
                    return;
                }
            }).then(() => {
                // check if total volume has exceeded
                let beforeTime = utils.computePreviousTime(currentTime, 1, agent.maxVolume.unit);
                getOrders(order.agentID, currentTime, beforeTime).then((saOrders) => {
                    let qty = 0;
                    saOrders.forEach((saOrder) => {
                        saOrder = saOrder.toJSON();
                        qty += Number(saOrder.payload.orderLine[0].lineItem.quantity.value);
                    });

                    qty += Number(order.payload.orderLine[0].lineItem.quantity.value)

                    if (agent.maxVolume.value < qty) {
                        reject({code: 1003, msg: `maxVolume has been breached for order id ${order.id}`});
                        return;
                    }

                    resolve();
                })
            }).catch((err) => {
                console.log(`err: ${err}`)
            });
        });
    })
};


module.exports = AgentHelper;
