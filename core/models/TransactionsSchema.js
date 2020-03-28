const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var TransactionSchema = new Schema({
    agentID: String,
    orderID: String,
    companyName: String,
    productID: String,
    productName: String,
    units: String,
    amount: String,
    status: String,
    processID: String
});

module.exports = mongoose.model('transactions', TransactionSchema);
