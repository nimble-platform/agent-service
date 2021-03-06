var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var saApprovedOrders = new Schema({
    id: String,
    agentID: String,
    payload: Object,
    timeStamp: Number,
    nextTime: Number,
    approvedTime: Number
});

module.exports = mongoose.model('sa-orders-approved', saApprovedOrders);
