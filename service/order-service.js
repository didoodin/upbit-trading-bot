const { ROUTE, API_CODE } = require('../common/constants');
const api = ROUTE.orders;
let reqInfo = {};

const setOrderReqInfo = async (req, res) => {
    const _ = require('lodash');
    let path = req._parsedUrl.path;
    reqInfo = {};

    console.info('[UPBIT-TRADING-BOT] SET ORDER REQUEST INFO START');

    switch (path) {
        case api.chance.path: // 주문 가능 정보
            reqInfo.path = path = api.chance.path;
            reqInfo.code = code = api.chance.code;
            reqInfo.method = method = api.chance.method;
            console.info(`[UPBIT-TRADING-BOT][${code}] GET CHANCE !!`);
            break;
        case api.order.path: // 주문하기
            reqInfo.path = path = api.order.path;
            reqInfo.code = code = api.order.code;
            reqInfo.method = method = api.order.method;
            // 주문 요청 데이터 세팅 필요
            console.info(`[UPBIT-TRADING-BOT][${code}] ORDER !!`);
            break;
        default:
            throw new Error(`[UPBIT-TRADING-BOT] ERROR`);
    }

    reqInfo.params = req.body;
    console.info('[UPBIT-TRADING-BOT][', code, '] SET ORDER REQUEST INFO = ', reqInfo);

    return reqInfo;
}

/**
 * 주문 API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const executeOrder = async (req, res) => {
    console.info('[UPBIT-TRADING-BOT][-ORDER-] START');
    console.info('[UPBIT-TRADING-BOT][-ORDER-] REQ-BODY : ', req);
    const { call } = require('../utils/api-client');
    let data = {};

    try {
        data = await call(api.order.method, (api.route + api.order.path), req);

        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] ERROR : ', e.code);
        return e;
    } 
};

/**
 * 주문 정보 계산
 * @param {*} param0 
 * @returns 
 */
const checkOrderAmount = async (req, res) => { // accountBalance, entryPrice
    // 계좌 대비 리스크 허용 비율 조회
    const supabase = require('../utils/supabase');
    const riskPercentage = 0.02;

    const stopLossPercentage = 0.05;  // 손절가 계산 비율 (5%)
    const maxAllocation = await supabase.selectCommonConfig(API_CODE.MAX_ALLOCATION); // 계좌 대비 최대 매수 금액 비율
    const minOrderPrice = 5000;      // 최소 주문 금액
    const minOrderSize = 0.0001;      // 최소 주문 단위
    const feeRate = 0.05;            // 거래소 수수료 비율 (0.05%)

    const side = req.side;
    const accountBalance = req.accountBalance;
    const entryPrice = req.entryPrice;

    let orderQuantity;
  
    try {
        // 1. 손절가 자동 계산
        const stopLossPrice = entryPrice * (1 - stopLossPercentage);
        // console.debug(stopLossPrice);

        // 2. 최대 손실 허용 금액 계산
        const maxLossAmount = accountBalance * riskPercentage;
        // console.debug(maxLossAmount);
    
        // 3. 최대 매수 금액 계산
        const maxBuyAmount = accountBalance * maxAllocation;
        // console.debug(maxBuyAmount);
    
        // 4. 리스크 기준 주문 수량 계산
        const quantityBasedOnRisk = maxLossAmount / (entryPrice - stopLossPrice);
        // console.debug(quantityBasedOnRisk);
    
        // 5. 최대 매수 금액 기준 주문 수량 계산
        const quantityBasedOnAllocation = maxBuyAmount / entryPrice;
        // console.debug(quantityBasedOnAllocation);
    
        // 6. 최소값으로 주문 수량 제한
        orderQuantity = Math.min(quantityBasedOnRisk, quantityBasedOnAllocation);
        // console.debug(orderQuantity);
    
        // 7. 수수료 반영
        orderQuantity *= (1 - feeRate);
        // console.debug(orderQuantity);
    
        // 8. 최소 주문 단위로 반올림
        orderQuantity = Math.floor(orderQuantity / minOrderSize) * minOrderSize;
        // console.debug(orderQuantity);
    
        // 9. 최소 주문 금액 검증
        const orderPrice = Math.round(orderQuantity * entryPrice); // 주문 금액
        // console.debug(orderPrice);
        
        if (orderPrice < minOrderPrice) {
            console.error('[UPBIT-TRADING-BOT][-VOLUME-][BUY] INSUFFICIENT BALANCE');
            return 0; // 주문 불가능
        } 

        if (side === API_CODE.BUY) {
            console.info('[UPBIT-TRADING-BOT][-VOLUME-][BUY] TARGET ORDER AMOUNT : ', orderPrice);
            return orderPrice;
        } else if (side === API_CODE.SELL) {
            return orderQuantity;
        }
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-VOLUME-] ERROR : ', e);
        return e;
    }
  }

module.exports = { setOrderReqInfo, checkOrderAmount, executeOrder };