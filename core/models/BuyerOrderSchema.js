var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BuyingAgentSchema = new Schema({
    id: String,
    agentID: String,
    payload: Object,
    timeStamp: Number,
    nextTime: Number
});

module.exports = mongoose.model('buy-data-scheme', BuyingAgentSchema);
