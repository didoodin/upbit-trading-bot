const { ROUTE } = require('../common/constants');
const { call } = require('../utils/api-client');
const api = ROUTE.ticker;

/**
 * 종목 단위 현재가 정보 API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getTicker = async (req, res) => {
    let code = '';
    let data = {};

    try {
        let params = req.body ? req.body : req; 

        code = api.ableInfo.code;
        console.info('[UPBIT-TRADING-BOT][', code, '] REQ-BODY : [', params,']');

        // api call
        data = await call(api.ableInfo.method, api.ableInfo.path, params);
        console.info('[UPBIT-TRADING-BOT][', code, '] RES-BODY : [', data, ']');
        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] ERROR :: ', e.message);
        return e;
    } 
};

module.exports = { getTicker };