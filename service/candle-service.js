const _ = require('lodash');
const { call } = require('../utils/api-client');

const { ROUTE } = require('../common/constants');
const api = ROUTE.candles;
let code = "";

const getCandle = async (req, res) => {
    let data = {};
    code = api.minute.code;
    console.log("[UPBIT-TRADING-BOT][- CANDLE -] START");

    try {
        let params = req.body;
        let unit = "/" + params.minutes; 
        delete params.minutes;
        console.log("[UPBIT-TRADING-BOT][- CANDLE -] REQ-BODY : [", params,"]");

        // api call
        data = await call(api.minute.method, (api.route + api.minute.path + unit), params);

        return data;
    } catch (e) {
        console.error("[UPBIT-TRADING-BOT] ERROR :: ", e.message);
    } 
};

module.exports = { getCandle };