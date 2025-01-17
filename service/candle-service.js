const _ = require('lodash');
const { call } = require('../utils/api-client');

const { ROUTE } = require('../common/constants');
const api = ROUTE.candles;
let code = '';

/**
 * 시세 캔들 조회 API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getCandle = async (req, res) => {
    console.info('[UPBIT-TRADING-BOT][-CANDLE-] START');
    code = api.minute.code;
    let data = {};
    let params = '';

    try {
        if (req) {
            if (req.body) {
                params = req.body;
            } else {
                params = req;
            }
        }

        let time = params.minutes;
        let unit = '/' + time;
        params.to = ''; 
        
        // delete params.minutes;
        delete params.code;

        console.info('[UPBIT-TRADING-BOT][-CANDLE-] REQ-BODY : ', params);

        // api call
        data = await call(api.minute.method, (api.route + api.minute.path + unit), params);

        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-CANDLE-] ERROR : ', e.message);
        return e;
    } 
};

module.exports = { getCandle };