const express = require('express');
const router = express.Router();

const controller = require('../controller/asset-controller');

const { ROUTE } = require('../common/constants');

// API route setting
router.get(ROUTE.asset.account.path, controller.accounts);

module.exports = router;