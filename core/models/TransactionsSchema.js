var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var enums = require('../enums/enums')

var TransactionSchema = new Schema({
    agentID: String,
    orders: [{
        companyName: String,
        productID: String,
        productName: String,
        units: String,
        amount: String,
        status: String,
        processID: String
    }]
});

module.exports = mongoose.model('transactions', TransactionSchema);
