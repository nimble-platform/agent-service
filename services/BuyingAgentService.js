const loggerWinston = require('../configs/logger');
const configs = require('../configs/config');
const sellingAgentSchema = require('../core/models/SellingAgentSchema');
const buyingAgentSchema = require('../core/models/BuyingAgentSchema');
const request = require('request');
const utils = require('./util');

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

module.exports = BuyingAgentService;
