const _ = require('lodash');
const { call } = require('../utils/api-client');

const { ROUTE } = require('../common/constants');
const api = ROUTE.orders;
let reqInfo = {};

const setOrderReqInfo = async (req, res) => {
    let path = req._parsedUrl.path;
    reqInfo = {};

    console.log("[UPBIT-TRADING-BOT] SET ORDER REQUEST INFO START");

    switch (path) {
        case api.chance.path: // 주문 가능 정보
            reqInfo.path = path = api.chance.path;
            reqInfo.code = code = api.chance.code;
            reqInfo.method = method = api.chance.method;
            console.log(`[UPBIT-TRADING-BOT][${code}] GET CHANCE !!`);
            break;
        case api.order.path: // 주문하기
            reqInfo.path = path = api.order.path;
            reqInfo.code = code = api.order.code;
            reqInfo.method = method = api.order.method;
            // 주문 요청 데이터 세팅 필요
            console.log(`[UPBIT-TRADING-BOT][${code}] ORDER !!`);
            break;
        default:
            throw new Error(`[UPBIT-TRADING-BOT] ERROR`);
    }

    reqInfo.params = req.body;
    console.log("[UPBIT-TRADING-BOT][", code, "] SET ORDER REQUEST INFO = ", reqInfo);

    return reqInfo;
}

const executeOrder = async (req, res) => {
    let data = {};
    console.log(reqInfo);

    console.log("[UPBIT-TRADING-BOT][- ORDER -] START");

    try {
        let params = reqInfo.params;
        console.log("[UPBIT-TRADING-BOT][- ORDER -] REQ-BODY : [", params,"]");

        // api call
        data = await call(reqInfo.method, (api.route + reqInfo.path), params);
    } catch (e) {
        console.error("[UPBIT-TRADING-BOT] ERROR :: ", e.message);

        return e;
    } 

    return data;
};

module.exports = { setOrderReqInfo, executeOrder };