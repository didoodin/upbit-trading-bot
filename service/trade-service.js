const { getAccounts } = require('../service/account-service');
const { getTicker } = require('../service/ticker-service');
const { getCandle } = require('../service/candle-service');
const { makeRsi, makeBB } = require('../service/indicator-service');
const { checkSignal } = require('../service/signal-service');
const { checkOrderAmount, executeOrder } = require('../service/order-service');
const supabase = require('../utils/supabase');

const { ROUTE, API_CODE } = require('../common/constants');
const COUNT = 200;
const KRW = 'KRW';

/**
1. 사용자 주문 요청 정보 조회 (supabase)
2. 보조 지표 확인 후 신호 체크
	- 캔들 조회 API 요청 (upbit)
	- RSI 계산
	- 볼린저 밴드 계산
	- 현재가 정보 API 요청 (upbit)
3. 신호 분기 (0 : 대기 / 1 : 매수 / -1 : 매도)
	- 계좌 조회 API 요청 (upbit)
	    - 코인 존재 여부 체크
    3-1. 매수
        - 주문 금액 계산 (내 보유 자산 기준)
        3-1-1. 목표 코인 : 보유 O (분할 매수 시도)
            - 목표 단가 도달 여부 체크 (내 평단 -8%) -> 도달 O : 시장가 매수 (1)
        3-1-2. 목표 코인 : 보유 X
            - 시장가 매수 시도 (2)
    3-2. 매도
        3-2-1. 목표 코인 미보유 -> 리턴
        3-2-2. 목표 코인 보유
            - 목표 단가 설정 (내 평단 +8%) -> 도달 시 매도 (1)
                - 내 보유 수량 체크
    3-3. 대기 -> 리턴
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const executeTrade = async (req, res) => {
    const userId = req;
    let reqParam = {};
    let result = '';

    try {
        let period = '';
        let marketId = '';
        let KoreaMarketId = '';
        let currentPrice = '';
        let candle = {};
        let signal = 0;

        // 사용자 주문 요청 정보 조회
        const orderRequest = await supabase.selectOrderRequestbyId(userId);
        
        if (orderRequest) {
            marketId = orderRequest.market;
            KoreaMarketId = KRW + '-' + orderRequest.market; // KRW-MARKET ID
            period = orderRequest.period;

            // 캔들 조회
            candle = await getCandle({ minutes: period, market: KoreaMarketId, count: COUNT });

            // RSI 계산
            candle.push({ code: ROUTE.indicators.rsi.code });
            const rsi = await makeRsi(candle);
            console.info('[UPBIT-TRADING-BOT][-TRADE-] RSI :', rsi);

            // 볼린저 밴드 계산
            candle.push({ code: ROUTE.indicators.bb.code });
            const bb = await makeBB(candle);
            console.info('[UPBIT-TRADING-BOT][-TRADE-] BB :', bb[0]);

            // 현재가 정보
            const ticker = await getTicker({ markets : KoreaMarketId }); 
            currentPrice = ticker[0].trade_price; // 현재가 정보
            console.info('[UPBIT-TRADING-BOT][-TRADE-] CURRENT PRICE : ', currentPrice);

            // 신호 체크
            signal = await checkSignal({ 'currentPrice' : currentPrice, 'rsi' : rsi, 'bb' : bb });
            const side = signal !== 0 && signal > 0 ? API_CODE.BUY : API_CODE.SELL;

            // 계좌 조회
            let accountInfo = await getAccounts({});
            const hasBalance = accountInfo.find(item => item.currency === KRW)?.balance;
            const canInvest = hasBalance > 5000;

            if (!canInvest) {
                return result;
            } else {
                // 코인 존재 여부 및 목표 가격
                const { targetCoin, avgBuyPrice } = getTargetCoinInfo(accountInfo, marketId);

                switch (side) {
                    case API_CODE.BUY:
                        console.info('[UPBIT-TRADING-BOT][-TRADE-][BUY] ***** BUY START *****');
                        const balance = accountInfo.find(item => item.currency === KRW)?.balance;
                        const price = await checkOrderAmount({ side, accountBalance: balance, entryPrice: currentPrice });

                        if (price !== 0) {
                            const reqParam = { market: KoreaMarketId, side, price: price.toString(), ord_type: 'price' };
                            result = await handleBuyOrder(reqParam, currentPrice, targetCoin, avgBuyPrice);
                        }
                        console.info('[UPBIT-TRADING-BOT][-TRADE-][BUY] ***** BUY END *****');
                        break;

                    case API_CODE.SELL:
                        console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] ***** SELL START *****');
                        result = await handleSellOrder({}, KoreaMarketId, accountInfo, currentPrice, marketId);
                        console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] ***** SELL END *****');
                        break;

                    default:
                        console.info('[UPBIT-TRADING-BOT][-TRADE-] ***** ORDER WAIT *****');
                        return result;
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
            console.info('[UPBIT-TRADING-BOT][-TRADE-][BUY] MY AVG PRICE > CURRENT MARKET');
            return '';
        } else {
            return await executeOrder(reqParam); // 시장가 매수
        }   
    }
};

/**
 * 매도 주문 처리
 * @param {Object} reqParam - 주문 파라미터
 * @param {string} KoreaMarketId - 시장 ID (KRW-MARKET)
 * @param {Object} accountInfo - 계좌 정보
 * @param {number} currentPrice - 현재 가격
 * @param {string} marketId - 시장 ID (KRW-MARKET)
 * @returns {string} 주문 결과
 */
const handleSellOrder = async (reqParam, KoreaMarketId, accountInfo, currentPrice, marketId) => {
    const targetCoin = accountInfo.find(item => item.currency === marketId);

    if (!targetCoin) {
        console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] CANNOT SELL: NO COINS TO SELL');
        return '';
    }

    // 목표 단가 도달 여부 체크
    const isTargetReached = await getTargetReached(API_CODE.SELL, currentPrice, targetCoin.avg_buy_price);

    if (!isTargetReached) {
        console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] TARGET NOT REACHED');
        return ''; // 목표 도달하지 않으면 매도하지 않음
    } else {
        const volume = targetCoin.balance; // 보유 수량
        reqParam = { market: KoreaMarketId, side: API_CODE.SELL, volume, ord_type: 'market'};
        return await executeOrder(reqParam); // 매도
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
    let targetReached = false;

    if (side === API_CODE.BUY) {
        code = 'BUY';
        targetRatio = await supabase.selectCommonConfig(API_CODE.TARGET_BUY_RATE);
        targetPrice = avgBuyPrice * (1 - (targetRatio / 100));
        targetReached = currentPrice < targetPrice;
    } else {
        code = 'SELL';
        targetRatio = await supabase.selectCommonConfig(API_CODE.TARGET_SELL_RATE);
        targetPrice = avgBuyPrice * (1 + (targetRatio / 100));
        targetReached = currentPrice >= targetPrice;
    }

    console.info(`[UPBIT-TRADING-BOT][-TRADE-][${code}] MARKET PRICE : ${currentPrice} | TARGET PRICE : ${targetPrice}`);
    return side === API_CODE.BUY ? currentPrice < targetPrice : currentPrice >= targetPrice;
};

module.exports = { executeTrade }