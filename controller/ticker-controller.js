const { ROUTE } = require('../common/constants');
const { call } = require('../utils/api-client');
const api = ROUTE.ticker;
let code = "";

// 종목 단위 현재가 정보
exports.ticker = async (req, res) => {
    let data = {};
    code = api.ableInfo.code;
    console.log("[UPBIT-TRADING-BOT][", code, "] START");

    try {
        const params = req.body; 
        console.log("[UPBIT-TRADING-BOT][", code, "] REQ-BODY : [", params,"]");

        data = await call(api.ableInfo.method, api.ableInfo.path, params);
        console.log("[UPBIT-TRADING-BOT][", code, "] RES-BODY : [", data, "]");

        return res.json(data);
    } catch (e) {
        console.error("[UPBIT-TRADING-BOT] ERROR :: ", e.message);
    } 

};