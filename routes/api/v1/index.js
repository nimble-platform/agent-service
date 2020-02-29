var express = require('express');
const agentService = require('../../../services/agentService');
var router = express.Router();
var wLogger = require('../../../configs/logger');

const SELLING_AGENT = "SELLING_AGENT";
const BUYING_AGENT = "BUYING_AGENT";


router.get('/hello', function (req, res, next) {
    res.json({
        "welcomeMSG": "hello"
    })
});

router.post('/createSellingAgent', function (req, res, next) {
    agentService.createSellingAgent(req.body).then((results)=>{
        res.status(201).json(results)
    }).catch((err) =>{
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});

router.post('/createBuyingAgent', function (req, res, next) {
    agentService.createBuyingAgent(req.body).then((results)=>{
        res.status(201).json(results)
    }).catch((err) =>{
        res.status(400).json({msg: 'error when creating the selling agent'})
    })
});

router.post('/editSellingAgent', function (req, res, next) {
    res.json({
        "welcomeMSG": "hello"
    })
});

router.post('/editBuyingAgent', function (req, res, next) {
    res.json({
        "welcomeMSG": "hello"
    })
});

router.post('/deleteSellingAgent', function (req, res, next) {
    res.json({
        "welcomeMSG": "hello"
    })
});

router.post('/deleteSellingAgent', function (req, res, next) {
    res.json({
        "welcomeMSG": "hello"
    })
});


router.post('/activateSellingAgent', function (req, res, next) {
    agentService.activateAgent(req.body.agentID, SELLING_AGENT).then(() => {
        res.status(200);
    }).catch((err) => {
        res.status(400).json({msg: 'failed to activate the agent'})
    })
});

router.post('/deactivateSellingAgent', function (req, res, next) {
    agentService.deactivateAgent(req.body.agentID, SELLING_AGENT).then(() => {
        res.status(200);
    }).catch((err) => {
        res.status(400).json({msg: 'failed to deactivate the agent'})
    })
});

router.post('/activateBuyingAgent', function (req, res, next) {
    agentService.activateAgent(req.body.agentID, BUYING_AGENT).then(() => {
        res.status(200);
    }).catch((err) => {
        res.status(400).json({msg: 'failed to activate the agent'})
    })
});

router.post('/deactivateBuyingAgent', function (req, res, next) {
    agentService.deactivateAgent(req.body.agentID, BUYING_AGENT).then(() => {
        res.status(200);
    }).catch((err) => {
        res.status(400).json({msg: 'failed to deactivate the agent'})
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

module.exports = router;
