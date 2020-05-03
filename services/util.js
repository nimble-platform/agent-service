const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const buyerOrderSchema = require('../core/models/BuyerOrderSchema');
const saOrderApproved = require('../core/models/OrdersApprovedSA');
const request = require('request');
const axios = require('axios');
// const catLine1 = require('../core/data/catLine');


const getMax = (arr) => {
    var max = null;
    for (let i = 0; i < arr.length; i++) {
        if (max == null || parseInt(arr[i]['allowanceCharge'][0]['amount']['value'])
                    > parseInt(max['allowanceCharge'][0]['amount']['value']))
            max = arr[i];
    }
    return max;
};


const getApplicableDiscounts = ((catLine) => {
    if (!catLine.hasOwnProperty('priceOption')) {
        return;
    }

    let data = {
        itemProperty: [],
        unit: []
    };

    for (let i = 0; i < catLine['priceOption'].length; i++) {
        let pOption = catLine['priceOption'][i];
        if (pOption['additionalItemProperty'].length !== 0) {
            let iProperty = pOption['additionalItemProperty'][0];
            iProperty['allowanceCharge'] = pOption['itemLocationQuantity']['allowanceCharge'];
            data.itemProperty.push(iProperty);
        }else {
            let unit = pOption['itemLocationQuantity']['allowanceCharge'];
            data.unit.push(unit);
        }
    }

    // group by property
    let group = {};
    for (let i = 0; i < data.itemProperty.length; i++) {
        let iProperty = data.itemProperty[i];
        if (group[iProperty.id]) {
            group[iProperty.id]['items'].push(iProperty);
        }else {
            group[iProperty.id] = {};
            group[iProperty.id]['items'] = [];
            group[iProperty.id]['items'].push(iProperty);
        }
    }

    let applicableDiscounts = {
        items: []
    };

    for (let key in group) {
        let max = getMax(group[key]['items']);
        if (0 < max['allowanceCharge'][0]['amount']['value']) {
            applicableDiscounts.items.push(max);
        }
    }

    return applicableDiscounts;
});

// getApplicableDiscounts(catLine1);

const calculateTotalDiscount = ((applicableDiscounts) => {
    let perUnitDiscount = 0;
    let totalDiscount = 0;

    applicableDiscounts.items.forEach((d) => {
        if (d['allowanceCharge'][0]['amount']['currencyID'] === "%") {
            totalDiscount =+ d['allowanceCharge'][0]['amount']['value'];
        }else {
            perUnitDiscount =+ d['allowanceCharge'][0]['amount']['value'];
        }

    });

    return {perUnitDiscount: perUnitDiscount, totalDiscount: totalDiscount};
});


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
                    let catLine = catLines[j];
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

function addZeroes(num) {
    // Cast as number
    var num = Number(num);
    // If not a number, return 0
    if (isNaN(num)) {
        return 0;
    }
    // If there is no decimal, or the decimal is less than 2 digits, toFixed
    if (String(num).split(".").length < 2 || String(num).split(".")[1].length<=2 ){
        num = num.toFixed(2);
    }
    // Return the number
    return num;
}


const getMaxQuantityToBuy = ((qtyMax, priceMax, catLine, perUnitDiscount, totalDiscount, tax) => {
    let perUnitCost = catLine['requiredItemLocationQuantity']['price']['priceAmount']['value'];

    if (perUnitDiscount !== null) {
        perUnitCost = perUnitCost - perUnitDiscount;
    }

    if(totalDiscount !== null){
        perUnitCost = perUnitCost - (perUnitCost * (totalDiscount/100))
    }

    let perUnitCostWithoutTax = perUnitCost.toFixed(2);
    perUnitCost = (perUnitCost + (perUnitCost * (tax / 100))).toFixed(2);

    let qty = Math.min(
        Math.floor(priceMax / perUnitCost),
        qtyMax
    );

    let total = qty * perUnitCost;
    let totalString = addZeroes(total.toFixed(2));
    let netCost = perUnitCostWithoutTax * qty;
    let netCostString = addZeroes((perUnitCostWithoutTax * qty).toFixed(2));

    return {
        qty: qty,
        value: perUnitCost,
        total: total,
        totalString: totalString,
        netCost: netCost,
        netCostString: netCostString,
        perUnitCostWithoutTax: perUnitCostWithoutTax
    }
});

const calculateCompanyRating = ((ratings) => {
    return 5;
});


const getRatings = (async (partyID) => {
    try {
        let config = {
            method: 'get',
            url: `${configs.baseUrl}/business-process/ratingsSummary?partyId=${partyID}`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json',
                'federationId': configs.federationID
            },
        };

        let results = await axios(config);
        let ratings = results.data;
        let ratingOverall = 0;
        let ratingSeller;
        let ratingFulfillment;
        if (ratings && ratings.totalNumberOfRatings > 0) {
            ratings.qualityOfNegotiationProcess /= ratings.totalNumberOfRatings;
            ratings.qualityOfOrderingProcess /= ratings.totalNumberOfRatings;
            ratings.responseTimeRating /= ratings.totalNumberOfRatings;
            ratings.listingAccuracy /= ratings.totalNumberOfRatings;
            ratings.conformanceToContractualTerms /= ratings.totalNumberOfRatings;
            ratings.deliveryAndPackaging /= ratings.totalNumberOfRatings;
            ratingSeller = (ratings.qualityOfNegotiationProcess + ratings.qualityOfOrderingProcess + ratings.responseTimeRating) / 3;
            ratingFulfillment = (ratings.listingAccuracy + ratings.conformanceToContractualTerms) / 2;
            if (ratings.deliveryAndPackaging > 0) {
                ratingOverall = (ratingSeller + ratingFulfillment + ratings.deliveryAndPackaging) / 3;
            } else {
                ratingOverall = (ratingSeller + ratingFulfillment) / 2;
            }
        }

        ratingOverall = ratingOverall.toFixed(2);
        return ratingOverall;
    } catch (error) {
        console.log(error);
        return 0;
    }

});


let util = {
    generateUUID: () => {
        let d = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
                productList[i]['rating'] = Number(await getRatings(productList[i]['manufacturer']['id']));
                productList[i]['discounts'] = await getApplicableDiscounts(catLine);
                let discount = await calculateTotalDiscount(productList[i]['discounts']);
                let tax = await getTaxPercentage(catLine);
                productList[i]['bestPrice'] = getMaxQuantityToBuy(agent['maxUnits'], agent['maxTotal'], catLine, discount.perUnitDiscount, discount.totalDiscount, tax);
            }
        }

        let finalList = [];

        if (productList.length === 1) {
            productList[0]['purchase'] = true;
            return productList;
        }else if (1 < productList.length) {
            let unitsSorted = sortByUnits(JSON.parse(JSON.stringify(productList)));
            let trustSorted = sortByTrust(JSON.parse(JSON.stringify(productList)));

            if (agent.priceRisk === 100) {
                finalList.push(unitsSorted[unitsSorted.length - 1]);
            }else {
                let unitsSorted = sortByUnits(JSON.parse(JSON.stringify(productList)));
                let trustSorted = sortByTrust(JSON.parse(JSON.stringify(productList)));

                let priceQty = Math.floor(unitsSorted[1].bestPrice.qty * (agent.priceRisk / 100));
                let trustQty = Math.floor(unitsSorted[1].bestPrice.qty * ((100 - agent.priceRisk) / 100));

                if (0 < priceQty) {
                    let total = unitsSorted[unitsSorted.length - 1]['bestPrice']['value'] * priceQty;
                    unitsSorted[unitsSorted.length - 1]['bestPrice']['totalString'] = addZeroes(total.toFixed(2));
                    unitsSorted[unitsSorted.length - 1]['bestPrice']['qty'] = priceQty;
                    unitsSorted[unitsSorted.length - 1]['purchase'] = true;
                    finalList.push(unitsSorted[unitsSorted.length - 1])
                }

                if (0 < trustQty) {
                    let trustTotal = trustSorted[trustSorted.length - 1]['bestPrice']['value'] * trustQty;
                    trustSorted[trustSorted.length - 1]['bestPrice']['totalString'] = addZeroes(trustTotal.toFixed(2));
                    trustSorted[trustSorted.length - 1]['bestPrice']['qty'] = trustQty;
                    trustSorted[trustSorted.length - 1]['purchase'] = true;
                    finalList.push(trustSorted[trustSorted.length - 1])
                }
            }
        }

        return finalList;
    }
};

const recalculateCost = (() => {


});

const getTaxPercentage = ((catLine) => {
    let tax = 0;

    try {
        if (catLine['requiredItemLocationQuantity'].hasOwnProperty('applicableTaxCategory')) {
            if (catLine['requiredItemLocationQuantity']['applicableTaxCategory'].length !== 0) {
                tax = catLine['requiredItemLocationQuantity']['applicableTaxCategory'][0]['percent'];
            }
        }
    }catch (e) {
        console.log('error occurred while reading the tax value');
    }

    return tax;
});

function compareByTrust( a, b ) {
    if ( a.rating < b.rating){
        return -1;
    }
    if ( a.rating > b.rating){
        return 1;
    }
    return 0;
}

function compareByQty( a, b ) {
    if ( a.bestPrice.qty < b.bestPrice.qty){
        return -1;
    }
    if ( a.bestPrice.qty > b.bestPrice.qty ){
        return 1;
    }
    return 0;
}

const sortByUnits = ((productList) => {
    return productList.sort(compareByQty);
});


const sortByTrust = ((productList) => {
    return productList.sort(compareByTrust)
});


module.exports = util;
