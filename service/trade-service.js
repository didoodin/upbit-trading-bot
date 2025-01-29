const { getAccounts } = require('../service/account-service');
const { getTicker } = require('../service/ticker-service');
const { getAllMarket, getCandle } = require('./market-service');
const { checkCross, handleCrossEvent, makeRSI, makeBB } = require('../service/indicator-service');
const { checkSignal } = require('../service/signal-service');
const { checkOrderAmount, executeOrder, handleCutLoss, handleCutLossByThreshold } = require('../service/order-service');
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
    let accountInfo;
    let result;

    try {
        console.info(' ==================================================================================== ');

        // 계좌 조회
        accountInfo = await getAccounts({});

        // 진행 전 비트코인 하락 여부 및 전체 종목 체크
        let isBtcDown = false;
        isBtcDown = await preOrderCheck({ accountInfo });

        if (isBtcDown) {
            console.info('[UPBIT-TRADING-BOT][-TRADE-][ BTC ]');
            console.info(' ------------------------------------------------------------------------------------ ');
            console.info(' ********** BTC DOWN ********** ');

            // 보유 종목 전체 손절
            for (const { market } of accountInfo) {
                console.info('PROCESSING CUT LOSS FOR MARKET : [',market,']');
                handleCutLoss({'marketId' : market, accountInfo});
            }

            console.info(' ------------------------------------------------------------------------------------ ');
            return result;
        } else {
            // 주문 요청 정보 조회
            let tradeInfos = await supabase.selectTradeInfo({ useYn: 'Y' });

            if (tradeInfos && tradeInfos.length > 0) {
                // 주문 요청 랜덤 셔플
                tradeInfos = _.shuffle(tradeInfos);

                for (let i = 0; i < tradeInfos.length; i++) {
                    let marketId = tradeInfos[i].market;
                    let period = tradeInfos[i].period;

                try {
                    console.info('[UPBIT-TRADING-BOT][-TRADE-][',marketId,']');
                    console.info(' ------------------------------------------------------------------------------------ ');

                    // 캔들 조회
                    let candleList = await getCandle({ minutes: period, market: ('KRW-' + marketId), count: COUNT });

                    // RSI 계산
                    const rsi = await makeRSI(candleList);
                    console.info('RSI : ', rsi);

                    // 볼린저 밴드 계산
                    const bb = await makeBB(candleList);
                    console.info('BB : ', bb);

                    // 현재가 정보
                    const ticker = await getTicker({ markets: ('KRW-' + marketId) });
                    const currentPrice = ticker[0].trade_price;
                    console.info('CURRENT PRICE : ', currentPrice);

                    // 코인 존재 여부 및 목표 가격
                    const { targetCoin, avgBuyPrice } = await getTargetCoinInfo(accountInfo, marketId);

                    // 신호 체크
                    const side = await checkSignal({ currentPrice, rsi, bb });
                    console.info('SIGNAL : [', side, ']');

                    // // 손절 여부 체크 및 진행
                    if (targetCoin) await handleCutLossByThreshold(currentPrice, avgBuyPrice, accountInfo, marketId);

                    switch (side) {
                        case API_CODE.BUY:
                            console.info('ORDER STATUS : ********** BUY START **********');
                            const balance = accountInfo.find(item => item.currency === KRW)?.balance;

                            // 주문 정보 계산
                            const price = await checkOrderAmount({ side, accountBalance: balance, entryPrice: currentPrice });

                            if (price !== 0) {
                                const reqParam = { market: ('KRW-' + marketId), side, price: price.toString(), ord_type: 'price' };
                                result = await handleBuyOrder(reqParam, currentPrice, targetCoin, Number(avgBuyPrice));
                            }
                            console.info('ORDER STATUS : ********** BUY END **********');
                            console.info(' ------------------------------------------------------------------------------------ ');
                            break;

                        case API_CODE.SELL:
                            console.info('ORDER STATUS : ********** SELL START **********');
                            result = await handleSellOrder({}, accountInfo, currentPrice, marketId);
                            console.info('ORDER STATUS : ********** SELL END **********');
                            console.info(' ------------------------------------------------------------------------------------ ');
                            break;

                        default:
                            console.info('ORDER STATUS : ********** ORDER WAIT **********');
                            console.info(' ------------------------------------------------------------------------------------ ');
                            continue;
                        }
                    } catch (e) {
                        console.error('ERROR : ', e);
                        // 해당 항목에서 오류 발생 시 해당 거래만 건너뛰고 계속 진행
                        continue;
                    }
                }
                console.info(' ==================================================================================== ');
            }
        }
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-TRADE-] ERROR : ', e);
        require('../utils/interval-manager').stopInterval();
        return e;
    }

    return result;
}

/**
 * 전체 종목 크로스 체크
 */
const preOrderCheck = async (req, res) => {
    console.info(' ==================================================================================== ');

    // 주문 요청 정보 조회
    let tradeInfos = await supabase.selectTradeInfo({});

    if (tradeInfos && tradeInfos.length > 0) {
        for (let i = 0; i < tradeInfos.length; i++) {
            const marketId = tradeInfos[i].market;
            const period = tradeInfos[i].period;

            console.info('[UPBIT-TRADING-BOT][-TRADE-][',marketId,']');
            console.info(' ------------------------------------------------------------------------------------ ');

            // 캔들 조회
            const candleList = await getCandle({ minutes: period, market: ('KRW-' + marketId), count: COUNT });

            // 이동평균선 체크 -> 사용 여부 갱신 -> 데드크로스 종목 리턴 -> 손절 매도
            const cross = await checkCross(candleList, marketId);

            // 비트코인 하락세 시 true 리턴
            if (marketId === 'BTC') {
                if (cross === API_CODE.CROSS.DEAD) return true;
            } else {
                const disableTargetId = await handleCrossEvent(cross, marketId);
                if (disableTargetId) await handleCutLossByThreshold({ marketId : disableTargetId });   
            }
        console.info(' ------------------------------------------------------------------------------------ ');
        }
    }
    console.info(' ==================================================================================== ');
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
            console.info(`[BUY] MY AVG PRICE > CURRENT MARKET`);
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
        console.info('[SELL] CANNOT SELL: NO COINS TO SELL');
        return '';
    }

    // 목표 단가 도달 여부 체크
    const isTargetReached = await getTargetReached(API_CODE.SELL, currentPrice, targetCoin.avg_buy_price);

    if (!isTargetReached) {
        console.info('[SELL] TARGET NOT REACHED');
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
    if (targetPrice % 1 !== 0) targetPrice = targetPrice.toFixed(5);

    console.info('[TARGET REACHED] MARKET PRICE : ', currentPrice, ' | TARGET PRICE : ', Number(targetPrice));
    return side === API_CODE.BUY ? currentPrice < targetPrice : currentPrice >= targetPrice;
};

module.exports = { executeTrade }