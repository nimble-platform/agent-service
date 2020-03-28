var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BuyingAgentSchema = new Schema({
    id: String,
    payload: Object,
    timeStamp: Number
});

module.exports = mongoose.model('buy-data-scheme', BuyingAgentSchema);
