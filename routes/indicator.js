const express = require('express');
const router = express.Router();

const controller = require('../controller/indicator-controller');

const { ROUTE } = require('../common/constants');
const api = ROUTE.indicators;

// API route setting
router.get(api.rsi.path, controller.rsi);
router.get(api.bb.path, controller.bb);
router.get('/trade', controller.trade);

module.exports = router;