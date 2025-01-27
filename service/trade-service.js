const { getAccounts } = require('../service/account-service');
const { getTicker } = require('../service/ticker-service');
const { getAllMarket, getCandle } = require('./market-service');
const { checkMA, makeRSI, makeBB } = require('../service/indicator-service');
const { checkSignal } = require('../service/signal-service');
const { checkOrderAmount, executeOrder, executeCutLoss } = require('../service/order-service');
const supabase = require('../utils/supabase');
const _ = require('lodash');

const { ROUTE, API_CODE } = require('../common/constants');
const COUNT = 200;
const KRW = 'KRW';

/**
 * 주문(매수/매도)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const executeTrade = async (req, res) => {
    const userId = req;
    let result = '';

    try {
        let period = '';
        let marketId = '';
        let candleList = {};

        // // 종목 코드 조회
        // const allMarkets = await getAllMarket();
        // console.info(allMarkets);

        // 주문 요청 정보 조회
        let tradeInfos = await supabase.selectTradeInfo({});

        // 주문 요청 랜덤 셔플
        tradeInfos = _.shuffle(tradeInfos);
        
        if (tradeInfos && tradeInfos.length > 0) {
            console.info(" ######################################################################################### ");

            for (let i = 0; i < tradeInfos.length; i++) {
                const tradeInfo = tradeInfos[i];
                marketId = tradeInfo.market;
                period = tradeInfo.period;
                
                try {
                    // 현재가 정보
                    const ticker = await getTicker({ markets : ('KRW-' + marketId) }); 
                    const currentPrice = ticker[0].trade_price; // 현재가 정보
                    console.info('[UPBIT-TRADING-BOT][-TRADE-][',marketId,'] CURRENT PRICE ', currentPrice);

                    // 캔들 조회
                    candleList = await getCandle({ minutes: period, market: ('KRW-' + marketId), count: COUNT });

                    // 이동평균선 체크 후 주문 진행 여부 판단
                    const isProcessing = await checkMA(candleList, marketId);
                    console.info('[UPBIT-TRADING-BOT][-TRADE-][',marketId,'] PROCESSING STATUS : ', isProcessing);

                    if (isProcessing) {
                        // // RSI 계산
                        // candleList.push({ code: ROUTE.indicators.rsi.code });
                        // const rsi = await makeRSI(candleList);
                        // console.info("[UPBIT-TRADING-BOT][-TRADE-][",marketId,"] RSI : ", rsi);

                        // // 볼린저 밴드 계산
                        // candleList.push({ code: ROUTE.indicators.bb.code });
                        // const bb = await makeBB(candleList);
                        // console.info("[UPBIT-TRADING-BOT][-TRADE-][",marketId,"] BB : ", bb);

                        // // 신호 체크
                        // const side = await checkSignal({ currentPrice, rsi, bb });
                        // console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}] SIGNAL : ${side}`);

                        // // 계좌 조회
                        // const accountInfo = await getAccounts({});

                        // // 코인 존재 여부 및 목표 가격
                        // const { targetCoin, avgBuyPrice } = await getTargetCoinInfo(accountInfo, marketId);

                        // // 손절 여부 체크 및 진행
                        // if (targetCoin) {
                        //     await handleCutLoss(currentPrice, avgBuyPrice, accountInfo, marketId);
                        // }

                        // switch (side) {
                        //     case API_CODE.BUY:
                        //         console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}] ********** BUY START **********`);
                        //         const balance = accountInfo.find(item => item.currency === KRW)?.balance; 

                        //         // 주문 정보 계산
                        //         const price = await checkOrderAmount({ side, accountBalance: balance, entryPrice: currentPrice });

                        //         if (price !== 0) {
                        //             const reqParam = { market: ('KRW-' + marketId), side, price: price.toString(), ord_type: 'price' };
                        //             result = await handleBuyOrder(reqParam, currentPrice, targetCoin, Number(avgBuyPrice));
                        //         }
                        //         console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}] ********** BUY END **********`);
                        //         break;

                        //     case API_CODE.SELL:
                        //         console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}] ********** SELL START **********`);
                        //         result = await handleSellOrder({}, accountInfo, currentPrice, marketId);
                        //         console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}] ********** SELL END **********`);
                        //         break;

                        //     default:
                        //         console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}] ********** ORDER WAIT **********`);
                        //         console.info(" ######################################################################################### ");
                        //         continue;
                        // }
                    } else {
                        // await executeCutLoss({ currentPrice, accountInfo, marketId });
                    }

                    console.info(" ######################################################################################### ");
                } catch (e) {
                    console.error("[UPBIT-TRADING-BOT][-TRADE-] TRADE ERROR : ", e);
                    // 해당 항목에서 오류 발생 시 해당 거래만 건너뛰고 계속 진행
                    continue;
                }
            }
        }
        return result;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-TRADE-] ERROR : ', e);
        require('../utils/interval-manager').stopInterval();
        return e;
    }
}

/**
 * 매수 주문 처리
 * @param {Object} reqParam - 주문 파라미터
 * @param {number} currentPrice - 현재 가격
 * @param {Object} targetCoin - 목표 코인 정보
 * @param {number} avgBuyPrice - 평균 매수 가격
 * @returns {string} 주문 결과
 */
const handleBuyOrder = async (reqParam, currentPrice, targetCoin, avgBuyPrice) => {
    if (!targetCoin) { // 목표 코인 미보유
        return await executeOrder(reqParam); // 시장가 매수
    } else {
         // 목표 단가 도달 여부 체크
        const isTargetReached = await getTargetReached(API_CODE.BUY, currentPrice, avgBuyPrice);

        // 목표 가격 도달하지 않으면, 분할 매수 시도
        if (!isTargetReached) {
            console.info(`[UPBIT-TRADING-BOT][-TRADE-][BUY] MY AVG PRICE > CURRENT MARKET`);
            return '';
        } else {
            return await executeOrder(reqParam); // 시장가 매수
        }   
    }
};

/**
 * 매도 주문 처리
 * @param {Object} reqParam - 주문 파라미터
 * @param {Object} accountInfo - 계좌 정보
 * @param {number} currentPrice - 현재 가격
 * @param {string} marketId - 시장 ID (KRW-MARKET)
 * @returns {string} 주문 결과
 */
const handleSellOrder = async (reqParam, accountInfo, currentPrice, marketId) => {
    reqParam.currentPrice = currentPrice;
    const targetCoin = accountInfo.find(item => item.currency === marketId);

    if (!targetCoin) {
        console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}][SELL] CANNOT SELL: NO COINS TO SELL`);
        return '';
    }

    // 목표 단가 도달 여부 체크
    const isTargetReached = await getTargetReached(API_CODE.SELL, currentPrice, targetCoin.avg_buy_price);

    if (!isTargetReached) {
        console.info(`[UPBIT-TRADING-BOT][-TRADE-][${marketId}][SELL] TARGET NOT REACHED`);

        return ''; // 목표 도달하지 않으면 매도하지 않음
    } else {
        const volume = targetCoin.balance; // 보유 수량
        reqParam = { market: ('KRW-' + marketId), side: API_CODE.SELL, volume, ord_type: 'market', currentPrice };
        return await executeOrder(reqParam);
    }
};

/**
 * 계좌 조회 및 목표 코인 정보 반환
 * @param {Array} accountInfo - 계좌 정보
 * @param {string} marketId - 시장 ID (KRW-MARKET)
 * @returns {Object} targetCoin, avgBuyPrice
 */
const getTargetCoinInfo = (accountInfo, marketId) => {
    const targetCoin = accountInfo.find(item => item.currency === marketId);
    const avgBuyPrice = targetCoin ? targetCoin.avg_buy_price : 0;
    return { targetCoin, avgBuyPrice };
};

/**
 * 목표 단가 도달 여부 체크
 * @param {Object} req
 * @param {string} req.side - 주문 종류 (BUY or SELL)
 * @param {number} req.currentPrice - 현재 가격
 * @param {number} req.avgBuyPrice - 평균 매수 가격
 * @returns {boolean} 목표 도달 여부
 */
const getTargetReached = async (side, currentPrice, avgBuyPrice) => {
    let code = '';
    let targetRatio = 0;
    let targetPrice = 0;

    if (side === API_CODE.BUY) {
        code = 'BUY';
        targetRatio = await supabase.selectCommonConfig(API_CODE.TARGET_BUY_RATE);
        targetPrice = avgBuyPrice * (1 - (targetRatio / 100));
    } else {
        code = 'SELL';
        targetRatio = await supabase.selectCommonConfig(API_CODE.TARGET_SELL_RATE);
        targetPrice = avgBuyPrice * (1 + (targetRatio / 100));
    }

    // 현재가에 소수점 존재 시 5자리까지 반올림 처리
    if (targetPrice % 1 !== 0) {
        targetPrice = targetPrice.toFixed(5);
    }

    console.info(`[UPBIT-TRADING-BOT][-TRADE-][${code}] MARKET PRICE : ${currentPrice} | TARGET PRICE : ${targetPrice}`);
    return side === API_CODE.BUY ? currentPrice < targetPrice : currentPrice >= targetPrice;
};

/**
 * 손절 매도 여부 판단
 * @param {*} currentPrice 
 * @param {*} avgBuyPrice 
 * @returns 
 */
const handleCutLoss = async (currentPrice, avgBuyPrice, accountInfo, marketId) => {
    const threshold = await supabase.selectCommonConfig(API_CODE.CUT_LOSS_THRESHOLD);
    const priceDifference = (avgBuyPrice - currentPrice) / avgBuyPrice;

    const isCutLoss = priceDifference >= threshold;

    if (isCutLoss) {
        await executeCutLoss({ currentPrice, accountInfo, marketId });
    }
};

module.exports = { executeTrade }