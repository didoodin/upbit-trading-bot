const express = require('express');
const router = express.Router();

const controller = require('../controller/ticker-controller');

const { ROUTE } = require('../common/constants');

const api = ROUTE.ticker;

// API route setting
router.get(api.ableInfo.path, controller.ticker);

module.exports = router;