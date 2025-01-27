const _ = require('lodash');
const { call } = require('../utils/api-client');
const { ROUTE } = require('../common/constants');

/**
 * 종목 코드 조회 (업비트에서 거래 가능한 종목 목록)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getAllMarket = async (req, res) => {
    try {
        const data = await call(ROUTE.allMarket.minute.method, (ROUTE.allMarket.route + ROUTE.allMarket.minute.path), { 'is_details' : true });

        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-ALL MARKET-] ERROR : ', e.message);
        return e;
    } 
};

/**
 * 시세 캔들 조회 API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getCandle = async (req, res) => {
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

        // console.debug('[UPBIT-TRADING-BOT][-CANDLE-] REQ-BODY : ', params);
        data = await call(ROUTE.candles.minute.method, (ROUTE.candles.route + ROUTE.candles.minute.path + unit), params);
        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-CANDLE-] ERROR : ', e.message);
        return e;
    } 
};

module.exports = { getAllMarket, getCandle };