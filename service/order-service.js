const { ROUTE, API_CODE } = require('../common/constants');
const api = ROUTE.orders;
const supabase = require('../utils/supabase');
let reqInfo = {};

/**
 * 주문 관련 API 요청 정보 세팅 분기
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const setOrderReqInfo = async (req, res) => {
    const _ = require('lodash');
    let path = req._parsedUrl.path;
    reqInfo = {};

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
    // console.info('[UPBIT-TRADING-BOT][-ORDER-] REQ-BODY : ', req);
    const { call } = require('../utils/api-client');
    let data = {};

    try {
        // 주문
        data = await call(api.order.method, (api.route + api.order.path), req);

        // 주문 체결 이력 추가
        if (data.uuid) {
            console.info('[-ORDER-] ORDER SUCCESS');

            let type;
            let price;
            let amount;
            let fee;
            let closeYn;
    
            if (data.side === API_CODE.BUY) {
                type = 'BUY';
                price = data.price;
                amount = data.locked;
                fee = data.remaining_fee;
                closeYn = 'N';
            } else if (data.side === API_CODE.SELL) {
                type = 'SELL';
                price = req.currentPrice * data.volume;
                fee = price * 0.0005;
                amount = price + fee;
                closeYn = 'Y';
            }
    
            let tradeInfo = {
                'market' : data.market,
                'type' : type,
                'price': price, // 주문 당시 화폐 가격
                'fee': fee, // 사용된 수수료
                'amount': amount, // 거래 총액
                'closeYn' : closeYn
            };

            // 손절 시 체결 이력에 추가
            if (req.isCutLoss) {
                tradeInfo.desc = 'CUT LOSS';
            }
    
            await supabase.insertTradeHist(tradeInfo);

            // 매도일 경우, 기존 매수 주문 완료 여부 갱신
            if (type === API_CODE.SELL) {
                await supabase.updateCloseYnFromTradeHist({ 'market' : data.market });
                console.info('[-ORDER-] TRADE HIST STATUS -> CLOSED');
            }
        } else {
            console.info('[-ORDER-] ORDER FAIL : ', data);
        }

        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] ERROR : ', e.code);
        return e;
    } 
};

/**
 * 주문 정보 계산 시 매수/매도 분기
 * @param {*} param0 
 * @returns 
 */
const checkOrderAmount = async (req, res) => { // side, accountBalance, entryPrice
    const side = req.side;
    const accountBalance = req.accountBalance;
    const entryPrice = req.entryPrice;

    try {
        switch (side) {
            case API_CODE.BUY:
                if (accountBalance > 5000 && accountBalance <= 10000) {
                    console.info('[BUY] TARGET ORDER AMOUNT :', Math.round(accountBalance));
                    return Math.round(accountBalance);
                } else if (accountBalance > 10000 && accountBalance <= 20000) { // 계좌 잔액 10,000 ~ 20,000원 시 계좌 잔액의 0.6%
                    console.info('[BUY] TARGET ORDER AMOUNT :', Math.round(accountBalance * 0.6));
                    return Math.round(accountBalance * 0.6);
                } else {
                    console.info('[BUY] CALCULATE AMOUNT START :', accountBalance);
                    return await calculateAmount({ side, accountBalance, entryPrice });
                }
 
            case API_CODE.SELL:
                return await calculateAmount({ side, accountBalance, entryPrice }); // SELL 조건 처리
            }
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-TRADE-] ERROR : ', e);
        return e;
    }
}

/**
 * 주문 정보 계산
 * 매수 : return -> price
 * 매도 : return -> volume
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const calculateAmount = async (req, res) => {
    const side = req.side;
    const accountBalance = req.accountBalance;
    const entryPrice = req.entryPrice;

    try {
        let maxAllocation = await supabase.selectCommonConfig(API_CODE.MAX_ALLOCATION);
    
        const riskPercentage = 0.03;
        const stopLossPercentage = 0.015;  // 손절가 계산 비율 (1.5%)
        const minOrderPrice = 5000;      // 최소 주문 금액
        const minOrderSize = 0.0001;      // 최소 주문 단위
        const feeRate = 0.05;            // 거래소 수수료 비율 (0.05%)
        let orderQuantity;
    
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
        
        if (orderPrice < minOrderPrice) {
            console.error('[BUY] INSUFFICIENT BALANCE :', orderPrice);
            return 0; // 주문 불가능
        } 
    
        if (side === API_CODE.BUY) {
            console.info('[BUY] TARGET ORDER AMOUNT :', orderPrice);
            return orderPrice;
        } else if (side === API_CODE.SELL) {
            return orderQuantity;
        }
    } catch(e) {
        console.error('[UPBIT-TRADING-BOT][-TRADE-] ERROR : ', e);
        return e;
    }
}

/**
 * 손절 비율 계산
 * @param {*} currentPrice 
 * @param {*} avgBuyPrice 
 * @param {*} accountInfo 
 * @param {*} marketId 
 */
const handleCutLossByThreshold = async (currentPrice, avgBuyPrice, accountInfo, marketId) => {
    const threshold = await supabase.selectCommonConfig(API_CODE.CUT_LOSS_THRESHOLD);
    const priceDifference = (avgBuyPrice - currentPrice) / avgBuyPrice;
    const isCutLoss = priceDifference >= threshold;

    if (isCutLoss) {
        await executeCutLoss({ currentPrice, accountInfo, marketId });
    }
};

/**
 * 손절 매도 진행
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const executeCutLoss = async (req, res) => {
    const { currentPrice, accountInfo, marketId } = req;
    const targetCoin = accountInfo.find(item => item.currency === marketId);
    const volume = targetCoin.balance;

    // 손절 매도에만 isCutLoss를 넘겨줌
    const reqParam = { market: ('KRW-' + marketId), side: API_CODE.SELL, volume, ord_type: 'market', currentPrice, isCutLoss : true };

    console.info(`[SELL] CUT LOSS !!!!!`);
    return await executeOrder(reqParam); // 손절 매도
};

module.exports = { setOrderReqInfo, checkOrderAmount, executeOrder, handleCutLossByThreshold, executeCutLoss };