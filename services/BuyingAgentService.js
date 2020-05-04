const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const orderBASchema = require('../core/models/OrdersInitiatedBA');
const Order = require('../core/models/Order');
const request = require('request');
const utils = require('./util');
const axios = require('axios');
const agentService = require('./agentService');
const agentHelper = require('./agentHelper');

const getCompanySettings = (async (companyID) => {
    try {
        let config = {
            method: 'get',
            url: `http://nimble-staging.salzburgresearch.at/identity/company-settings/${companyID}/negotiation/`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json',
            }
        };

        return await axios(config);
    } catch (error) {
        console.log(error.response.body);
        throw error;
    }
});

const getContract = (async (sellerID, buyerID, federationID, paymentTerms) => {
    try {
        let url = `${configs.baseUrl}/business-process/contracts/terms-and-conditions?sellerPartyId=${sellerID}&incoterms=` +
            `&buyerPartyId=${buyerID}&tradingTerm=` + encodeURI(paymentTerms);

        let config = {
            method: 'get',
            url: url,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json',
                initiatorFederationId: federationID
            }
        };

        return await axios(config)
    } catch (error) {
        console.log(error.response.body);
        throw error;
    }
});

const getCatalogueLine = (async (catalogueID, productID) => {
    try {
        let config = {
            method: 'get',
            url: `${configs.baseUrl}/catalog/catalogue/${catalogueID}/catalogueline/${productID}`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json',
            }
        };

        return await axios(config);
    } catch (error) {
        console.log(error.response.body);
        throw error;
    }
});

const processDocument = (async (order) => {
    try {
        let config = {
            method: 'post',
            url: `${configs.baseUrl}/business-process/process-document`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json',
            },
            data: order
        };

        return await axios(config);
    } catch (error) {
        console.log(error.response.body);
        throw error;
    }
});


const createOrder = (async (sellerID, buyerID, federationID, qty, catID, pID, totalString, additionalItemProperty, price) => {
    try {

        let priceJson = {
            "priceAmount": {
                "value": Number(price.perUnitCostWithoutTax),
                "currencyID": "EUR",
            },
            "baseQuantity": {
                "value": 1,
                "unitCode": "item(s)",
                "unitCodeListID": null,
            },
        };

        let sellerCompanySettings = await getCompanySettings(sellerID);
        let buyerCompanySettings = await getCompanySettings(buyerID);

        let paymentTerms = 'EOM - End of month';
        if (sellerCompanySettings['data'].hasOwnProperty('paymentTerms') &&
            sellerCompanySettings['data']['paymentTerms'].length !== 0) {
            paymentTerms = sellerCompanySettings['data']['paymentTerms'][0];
        }

        let contract = await getContract(sellerID, buyerID, federationID, paymentTerms);

        let catLine = await getCatalogueLine(catID, pID);

        let totalValue = totalString;

        Order.orderLine[0].lineItem.clause = contract.data;
        Order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address = buyerCompanySettings.data.company.postalAddress;
        Order.orderLine[0].lineItem.quantity.value = qty;

        delete catLine.data.goodsItem.item['hjid'];

        Order.orderLine[0].lineItem.item = catLine.data.goodsItem.item;
        if (additionalItemProperty) {
            Order.orderLine[0].lineItem.item['additionalItemProperty'] = additionalItemProperty;
        }
        Order.orderLine[0].lineItem.lineReference[0]['lineID'] = pID;
        Order.orderLine[0].lineItem.price = priceJson;

        Order.buyerCustomerParty.party = buyerCompanySettings.data.company;
        Order.sellerSupplierParty.party = sellerCompanySettings.data.company;

        Order.contract[0]['clause'] = contract.data;
        Order.contract[0]['id'] = utils.generateUUID();

        // set payment means
        Order.anticipatedMonetaryTotal = {
            "payableAmount": {
                "value": totalValue,
                "currencyID": "EUR"
            }
        };
        Order.id = utils.generateUUID();

        let res = await processDocument(Order);

        Order['processData'] = res.data;
        await agentService.notifyAgent(Order);

        return Order;
    } catch (e) {
        throw e
    }
});


/**
 * Function executes the search for products endpoints using the
 * indexing service
 * @type {function(*): Promise<*>}
 */
const searchForProducts = (async (productName) => {
    return new Promise((resolve, reject) => {
        let data = {
            "sort": ["score desc"],
            "rows": 4,
            "start": 0,
            "q": `${productName}`
        };

        let options = {
            url: `${configs.baseUrl}/index/item/search`,
            headers: {
                'Authorization': configs.bearer,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };


        request.post(options, async function (err, res, body) {
            if (err) {
                console.log('Error :', err);
                reject();
            }else {
                resolve(JSON.parse(body));
            }
        })
    });

});


/**
 * Function creates the indexing service query to retrive the product names
 * @type {function(*): string}
 */
const createQuery = ((productNames) => {
    let q = `en_label:*${productNames[0]}*`;

    if (productNames.length > 1) {
        for (let i = 1; i < productNames.length; i++) {
            q = `${q} OR en_label:*${productNames[i]}*`
        }
    }

    return `(${q})`;
});


let BuyingAgentService = {
    startBuyingAgentProcessing : (async () => {
        try {
            let results = await buyingAgentSchema.find({isDeleted: false}).exec();
            let agents = [];

            for (let i = 0; i < results.length; i++) {
                let agent = await agentHelper.getTodayTransactionLimitForBA(results[i].toJSON());
                let productList = await searchForProducts(createQuery(agent.productNames), agent.catalogueName, agent.categoryNames);
                let includedProducts = await utils.filterProducts(productList['result'], agent.catalogueName, agent.categoryNames, 'eClass');

                // If the included products are zero then stop processing the request
                if (includedProducts.length === 0) {
                    continue;
                }

                productList = await utils.getPriceOptions(includedProducts, agent);

                for (let j = 0; j < productList.length; j++) {
                    if (productList[j]['purchase']) {
                        let sellerID = productList[j]['cat']['providerParty']['partyIdentification'][0]['id'];
                        let buyerID = agent['companyID'];
                        let federationID = 'STAGING';
                        let qty = productList[j]['bestPrice']['qty'];
                        let value = productList[j]['bestPrice']['totalString'];
                        let catID = productList[j]['catalogueId'];
                        let pID = productList[j]['manufactuerItemId'];

                        let discounts = null;
                        if(productList[i].discounts.items.length !== 0){
                            discounts = JSON.parse(JSON.stringify(productList[j].discounts.items));
                            discounts.forEach((d) => {
                                delete d.allowanceCharge;
                                delete d.hjid;
                                delete d.name[0].hjid
                                delete d.value[0].hjid
                                delete d.itemClassificationCode.hjid
                            });
                        }

                        let order = await createOrder(sellerID, buyerID, federationID, qty, catID, pID, value, discounts, productList[j]['bestPrice']);
                        order['agentID'] = agent.id;
                        agentHelper.addToBAInitiatedOrder(order);
                    }
                }
            }

        }catch (err) {
            console.log(`error occurred while procurring the products via BA err: ${err}`)
        }
    })
};

// BuyingAgentService.startBuyingAgentProcessing();
module.exports = BuyingAgentService;
