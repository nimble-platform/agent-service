var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BuyingAgentSchema = new Schema({
    id: String,
    companyID: String,
    agentName: String,
    maxContractAmount: {
        value: Number,
        unit: String
    },
    maxFulfillmentTime: {
        value: Number,
        unit: String
    },
    minFulfillmentTime: {
        value: Number,
        unit: String
    },
    maxNoContractPerDay: String,
    maxVolume: {
        value: Number,
        unit: String
    },
    maxNoOneToOne: {
        value: Number,
        unit: String
    },
    productNames: [String],
    isActive: Boolean,
    noOfTransactions: Number,
    lastActive: String,
    isDeleted: Boolean,
});

module.exports = mongoose.model('buying-agent', BuyingAgentSchema);
