const { ROUTE } = require('../common/constants');
const { call } = require('../utils/api-client');
const api = ROUTE.asset;
let code = "";

// 전체 계좌 조회
exports.accounts = async (req, res) => {
    let data = {};
    code = api.account.code;
    console.log("[UPBIT-TRADING-BOT][", code, "] START");

    try {
        data = await call(api.account.method, api.account.path, null);
        console.log("[UPBIT-TRADING-BOT][", code, "] RES-BODY : [", data, "]");

        return res.json(data);
    } catch (e) {
        console.error("[UPBIT-TRADING-BOT] ERROR :: ", e.message);
    }
};