const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const Order = require('../core/models/Order');
const request = require('request');
const utils = require('./util');
const axios = require('axios');

let BuyingAgentService = {

    searchForProducts: ((productName, catName, categoriesNames, className) => {
        let data = {
            "sort": ["score desc"],
            "rows": 12,
            "start": 0,
            "q": `(*${productName}*)`
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
                return
            }
            let productList = JSON.parse(body);
            let includedProducts = await utils.filterProducts(productList['result'], catName, categoriesNames, className);
            await utils.purchaseProducts(includedProducts);
        })
    })

};

// BuyingAgentService.searchForProducts('niros piano', 'Music', ['Musical instrument'], 'eClass');

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


const createOrder = (async (sellerID, buyerID, federationID, qty, catID, pID) => {
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
        let totalValue = "37550.00";

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



createOrder('50916', '123118', 'STAGING', 4999, '755d2b9f-9e00-4943-a291-924e36cc0486', 'ff1c8a90-6248-494d-8d12-4292c7b40185');




module.exports = BuyingAgentService;
