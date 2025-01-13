const express = require('express');
const router = express.Router();

const controller = require('../controller/order-controller');

const { ROUTE } = require('../common/constants');
const api = ROUTE.orders;

// API route setting
router.get(api.chance.path, controller.orders);
router.post(api.order.path, controller.orders);

module.exports = router;