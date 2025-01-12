const express = require('express');
const router = express.Router();

const controller = require('../controller/candle-controller');

const { ROUTE } = require('../common/constants');
const api = ROUTE.candles;

// API route setting
router.get(api.minute.path, controller.minute);

module.exports = router;