const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const orderBASchema = require('../core/models/OrdersInitiatedBA');
const Order = require('../core/models/Order');
const request = require('request');
const utils = require('./util');
const axios = require('axios');
const agentService = require('./agentService')
const agentHelper = require('./agentHelper')

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

        let res =  await axios(config);
        console.log(res);
    } catch (error) {
        console.log(error.response.body);
        throw error;
    }
});


const createOrder = (async (sellerID, buyerID, federationID, qty, catID, pID, value) => {
    try {
        let sellerCompanySettings = await getCompanySettings(sellerID);
        let buyerCompanySettings = await getCompanySettings(buyerID);

        let paymentTerms = 'EOM - End of month';
        if (sellerCompanySettings['data'].hasOwnProperty('paymentTerms') &&
            sellerCompanySettings['data']['paymentTerms'].length !== 0) {
            paymentTerms = sellerCompanySettings['data']['paymentTerms'][0];
        }

        let contract = await getContract(sellerID, buyerID, federationID, paymentTerms);

        let catLine = await getCatalogueLine(catID, pID);

        // TODO calculate value for qty
        let totalValue = toString(value);

        Order.orderLine[0].lineItem.clause = contract.data;
        Order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address = buyerCompanySettings.data.company.postalAddress;
        Order.orderLine[0].lineItem.quantity.value = qty;

        delete catLine.data.goodsItem.item['hjid'];

        Order.orderLine[0].lineItem.item = catLine.data.goodsItem.item;
        Order.orderLine[0].lineItem.lineReference[0]['lineID'] = pID;
        Order.orderLine[0].lineItem.price = catLine.data.requiredItemLocationQuantity.price;

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
        let res = processDocument(Order);

        // TODO if success save process ID for negotiations
        console.log(res);
    } catch (e) {
        throw e
    }
});


const searchForProducts = ((productName) => {
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

const createQuery = ((productNames) => {
    let q = `en_label:*${productNames[0]}*`;

    if (productNames.length > 1) {
        for (let i = 1; i < productNames.length; i++) {
            q = `${q} OR en_label:*${productNames[i]}*`
        }
    }

    return `(${q})`;
});


const startBuyingAgentProcessing = (async () => {
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
                if (productList[i][purchase]) {
                    let sellerID = productList[i]['cat']['providerParty']['partyIdentification'][0]['id'];
                    let buyerID = agent['companyID'];
                    let federationID = 'STAGING';
                    let qty = productList[i]['bestPrice']['qty'];
                    let value = productList[i]['bestPrice']['value'];
                    let catID = productList[i]['catalogueId'];
                    let pID = productList[i]['manufactuerItemId'];
                    createOrder(sellerID, buyerID, federationID, qty, catID, pID, value);
                }
            }


            agents.push(agent.toJSON());
        }

    }catch (err) {
        console.log(`error occurred while procurring the products via BA err: ${err}`)
    }
});




startBuyingAgentProcessing();

let BuyingAgentService = {

};

// BuyingAgentService.searchForProducts('niros piano', 'Music', ['Musical instrument'], 'eClass');




// createOrder('50916', '123118', 'STAGING', 4999, '755d2b9f-9e00-4943-a291-924e36cc0486', 'ff1c8a90-6248-494d-8d12-4292c7b40185');




module.exports = BuyingAgentService;
