var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var enums = require('../enums/enums')

var BuyingAgentSchema = new Schema({
    companyID: String,
    agentName: String,
    maxContractAmount: {
        value: String,
        unit: String
    },
    maxFulfillmentTime: {
        value: String,
        unit: String
    },
    minFulfillmentTime: {
        value: String,
        unit: String
    },
    maxNoContractPerDay: String,
    maxVolume: {
        value: String,
        unit: String
    },
    maxNoOneToOne: {
        value: String,
        unit: String
    },
    productNames: [String],
    isActive: Boolean,
    noOfTransactions: Number,
    lastActive: String,
    isDeleted: Boolean,
});

module.exports = mongoose.model('buying-agent', BuyingAgentSchema);
