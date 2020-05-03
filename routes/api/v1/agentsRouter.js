var express = require('express');
const agentService = require('../../../services/agentService');
const buyingAgentService = require('../../../services/BuyingAgentService');
var router = express.Router();
var wLogger = require('../../../configs/logger');

const SELLING_AGENT = "SELLING_AGENT";
const BUYING_AGENT = "BUYING_AGENT";


router.post('/createSellingAgent', function (req, res, next) {
    agentService.createSellingAgent(req.body).then((results) => {
        res.status(201).json(results)
    }).catch((err) => {
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});

router.post('/createBuyingAgent', function (req, res, next) {
    agentService.createBuyingAgent(req.body).then((results) => {
        res.status(201).json(results)
    }).catch((err) => {
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});

router.post('/updateSellingAgent', function (req, res, next) {
    agentService.updateSellingAgent(req.body).then((results) => {
        res.status(201).json({msg: 'updated successfully'})
    }).catch((err) => {
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});

router.post('/updateBuyingAgent', function (req, res, next) {
    agentService.updateBuyingAgent(req.body).then((results) => {
        res.status(201).json({msg: 'updated successfully'})
    }).catch((err) => {
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});


router.post('/deleteSellingAgent', function (req, res, next) {
    agentService.deleteAgent(req.id, SELLING_AGENT).then((results)=>{
        res.status(201).json({msg: 'deleted the agent'})
    }).catch((err) =>{
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});

router.post('/deleteBuyingAgent', function (req, res, next) {
    agentService.deleteAgent(req.id, BUYING_AGENT).then((results)=>{
        res.status(201).json({msg: 'deleted the agent'})
    }).catch((err) =>{
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});


router.post('/activateSellingAgent', function (req, res, next) {
    agentService.activateAgent(req.body.agentID, SELLING_AGENT).then(() => {
        res.status(200).json({msg: 'activated the agent'})
    }).catch((err) => {
        res.status(400).json({msg: 'failed to activate the agent'})
    })
});

router.post('/deactivateSellingAgent', function (req, res, next) {
    agentService.deactivateAgent(req.body.agentID, SELLING_AGENT).then(() => {
        res.status(200).json({msg: 'deactivated all the agent'})
    }).catch((err) => {
        res.status(400).json({msg: 'failed to deactivate the agent'})
    })
});

router.post('/activateBuyingAgent', function (req, res, next) {
    agentService.activateAgent(req.body.agentID, BUYING_AGENT).then(() => {
        res.status(200).json({msg: 'activated the agent'})
    }).catch((err) => {
        res.status(400).json({msg: 'failed to activate the agent'})
    })
});

router.post('/deactivateBuyingAgent', function (req, res, next) {
    agentService.deactivateAgent(req.body.agentID, BUYING_AGENT).then(() => {
        res.status(200).json({msg: 'deactivated the agent'})
    }).catch((err) => {
        res.status(400).json({msg: 'failed to deactivate the agent'})
    })
});

router.post('/deactivateAllAgents', function (req, res, next) {
    agentService.deactivateAgent(req.body.agentID, BUYING_AGENT).then(() => {
        res.status(200).json({msg: 'deactivated all agents'})
    }).catch((err) => {
        res.status(400).json({msg: 'failed to deactivate the agents'})
    })
});


router.post('/deleteAgent', function (req, res, next) {
    agentService.deleteAgent(req.body.id, req.body.agentType).then(() => {
        res.status(200).json({msg: 'deleted the agent'});
    }).catch((err) => {
        res.status(400).json({msg: 'failed to delete the agent'})
    })
});

router.get('/getAllSellingAgents/:companyId', function (req, res, next) {
    agentService.getAllSellingAgents(req.params.companyId).then((agents) => {
        res.status(200).json(agents);
    }).catch((err) => {
        res.status(400).json({msg: 'error retrieving the results'})
    });
});

router.get('/getAllBuyingAgents/:companyId', function (req, res, next) {
    agentService.getAllBuyingAgents(req.params.companyId).then((agents) => {
        res.status(200).json(agents);
    }).catch((err) => {
        res.status(400).json({msg: 'error retrieving the results'})
    });
});

router.get('/getSAOrders/:agentId', function (req, res, next) {
    agentService.getSAOrders(req.params.agentId).then((agents) => {
        res.status(200).json(agents);
    }).catch((err) => {
        res.status(400).json({msg: 'error retrieving the results'})
    });
});

router.get('/getBAOrders/:agentId', function (req, res, next) {
    agentService.getBAOrders(req.params.agentId).then((agents) => {
        res.status(200).json(agents);
    }).catch((err) => {
        res.status(400).json({msg: 'error retrieving the results'})
    });
});

router.post('/notifyAgent', function (req, res, next) {
    agentService.notifyAgent(req.body).then(() => {
        res.status(200).send({msg: 'successfully notified the agent'})
    }).catch((err) => {
        res.status(400).json({msg: 'failed to notify the agent'})
    })
});


router.get('/hello', function (req, res, next) {
    res.status(201).json({msg: 'Agent Service'})
});

module.exports = router;
