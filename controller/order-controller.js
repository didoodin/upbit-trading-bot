const { setOrderReqInfo, executeOrder } = require('../service/order-service');

exports.orders = async (req, res) => {
    let params = {};
    let data = {};
    let reqInfo = {};
    let code = '';

    // 주문 요청 데이터 세팅
    if (req != null) {
        reqInfo = setOrderReqInfo(req);    
        code = reqInfo.code;
        params = req.body;
    }

    try {
        console.info('[UPBIT-TRADING-BOT][', code, '] REQ-BODY : [', params,']');
        
        data = executeOrder(reqInfo);

        console.info('[UPBIT-TRADING-BOT][', code, '] RES-BODY : [', data, ']');
        return res.json(data);
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][', code, '] ERROR : ', e.message);
        return res.json(e);
    } 
};