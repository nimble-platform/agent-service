const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const buyerOrderSchema = require('../core/models/BuyerOrderSchema');
const saOrderApproved = require('../core/models/OrdersApprovedSA');
const request = require('request');

const getCatalogue = (async (catID, catalogueName, commodityClassifciation, className) => {
    return new Promise((resolve, reject) => {
        let options = {
            url: `${configs.baseUrl}/catalog/catalogue/ubl/${catID}`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json'
            },
        };

        let lowerCase = commodityClassifciation.map(v => v.toLowerCase());
        let response = {
            status: false,
            cat: {}
        };

        request(options, function (err, res, body) {
            if (err) {
                console.log('Error :', err);
                resolve(response);
                return
            }

            let catData = JSON.parse(body);
            if (!(catalogueName.toUpperCase() === catData.id.toUpperCase())) {
                resolve(response);
                return
            }

            for (let i = 0; i < catData.catalogueLine.length; i++) {
                let catLines = catData.catalogueLine[i]['goodsItem']['item']['commodityClassification'];

                for (let j = 0; j < catLines.length; j++) {
                    let catLine = catLines[i];
                    if (lowerCase.includes(catLine['itemClassificationCode']['name'].toLowerCase())) {
                        response.status = true;
                        response.cat = catData;
                        break
                    }
                }
                if (response.status) {
                    break;
                }
            }

            resolve(response);
        })
    });
});


const getCatalogueLine = ((catalogueID, productID) => {
    return new Promise((resolve, reject) => {
        let options = {
            url: `${configs.baseUrl}/catalog/catalogue/${catalogueID}/catalogueline/${productID}`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json'
            },
        };

        request(options, function (err, res, body) {
            if (err) {
                console.log('Error :', err);
                resolve(null);
                return
            }
            resolve(JSON.parse(body));
        })
    });
});

const getMaxQuantityToBuy = ((qtyMax, priceMax, catLine) => {
    let perUnitCost = catLine['requiredItemLocationQuantity']['price']['priceAmount']['value'];
    let qty = Math.min(
        Math.floor(priceMax / perUnitCost),
        qtyMax
    );

    return {qty: qty, value: perUnitCost}
});


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


    async filterProducts(products, catalgueName, categories, className) {
        return new Promise(async (resolve, reject) => {
            let includedProducts = [];
            for (let i = 0; i < products.length; i++) {
                let product = products[i];
                let catID = product['catalogueId'];

                let response = await getCatalogue(catID, catalgueName, categories, className);
                if (response.status) {
                    product.cat = response.cat;
                    includedProducts.push(product);
                }
            }
            resolve(includedProducts)
        });
    },

    async getPriceOptions(productList, agent) {

        for (let i = 0; i < productList.length; i++) {
            let catLine = await getCatalogueLine(productList[i]['catalogueId'], productList[i]['manufactuerItemId']);
            if (catLine != null) {
                productList[i]['catLine'] = catLine;
                productList[i]['bestPrice'] = getMaxQuantityToBuy(agent['maxUnits'], agent['maxTotal'], catLine);
            }
        }

        // TODO optimize cost
        for (let i = 0; i < productList.length; i++) {
            productList[i]['purchase'] = true;
        }

        return productList;
    }
};


module.exports = util;
