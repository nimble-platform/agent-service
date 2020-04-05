const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const buyerOrderSchema = require('../core/models/BuyerOrderSchema');
const saOrderApproved = require('../core/models/OrdersApprovedSA');
const randomstring = require("randomstring");


let util = {
    generateUUID: () => {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    },

    formatDate: () => {
        return moment(date).format("YYYY-MM-DD");
    },


    getTodayMorningTimeStamp: (() => {
        var d = new Date();
        return d.setHours(0, 0, 0, 0) / 1000;
    }),


    getToNightTimeStamp: (() => {
        var d = new Date();
        return d.setHours(23, 59, 59) / 1000;
    }),

    getCurrentEpochTime: (() => {
        return Math.round((new Date()).getTime() / 1000);
    }),


    computePreviousTime: ((epochTime, value, unit) => {
        let time = epochTime;
        if (unit === 'hour') {
            time = time - value * 3600
        } else if (unit === 'day') {
            time = time - value * 86400
        } else if (unit === 'week') {
            time = time - value * 604800
        }
        return time;
    }),
};


module.exports = util;
