const { getAccounts } = require('../service/account-service');
const { getTicker } = require('../service/ticker-service');
const { getCandle } = require('../service/candle-service');
const { makeRsi, makeBB } = require('../service/indicator-service');
const { checkSignal } = require('../service/signal-service');
const { calculateOrderAmount, executeOrder } = require('../service/order-service');

const { ROUTE, API_CODE } = require('../common/constants');

const MINUTE = 30;
const COUNT = 200;

const executeTrade = async (req, res) => {
    const market = 'KRW-ETH'; // DB 연동 시 수정
    let orderReqParam = {};
    let result = '';

    try {
        // 캔들 조회
        const candle = await getCandle({ minutes: MINUTE, market: market, count: COUNT });

        // RSI 계산
        console.info('[UPBIT-TRADING-BOT][-TRADE-] RSI CHECK');
        candle.push({ code: ROUTE.indicators.rsi.code });
        const rsi = await makeRsi(candle);
        console.info('[UPBIT-TRADING-BOT][-TRADE-] RSI :', rsi);

        // 볼린저 밴드 계산
        console.info('[UPBIT-TRADING-BOT][-TRADE-] BB CHECK');
        candle.push({ code: ROUTE.indicators.bb.code });
        const bb = await makeBB(candle);
        console.info('[UPBIT-TRADING-BOT][-TRADE-] BB :', bb[0]);

        // 현재가 정보
        let currentPrice = await getTicker({ markets : market }); 
        currentPrice = currentPrice[0].trade_price; // 현재가 정보
        console.info('[UPBIT-TRADING-BOT][-TRADE-] CURRENT PRICE : ', currentPrice);

        // 신호 체크
        const signal = await checkSignal({ currentPrice : currentPrice, rsi : rsi, bb : bb });
        console.info('[UPBIT-TRADING-BOT][-TRADE-] SIGNAL :: ', signal);

        if (signal != 0) {
            console.info('[UPBIT-TRADING-BOT][-TRADE-] ORDER INFO SETTING START !!');
            let side = '';

            // 계좌 조회
            let accountInfo = await getAccounts({});

            if (signal > 0) { // 매수
                side = API_CODE.SID;

                // 주문 금액 계산
                price = await calculateOrderAmount({ side : side, accountBalance : balance, entryPrice : currentPrice });
                console.info('[UPBIT-TRADING-BOT][-TRADE-] BUY PRICE : ', price);

                if (price > 0) { // 최소 주문 금액 이하 시 0이 리턴
                    orderReqParam = {
                        market : market,
                        side : side,
                        price : price.toString(),
                        ord_type : 'price' // 시장가 주문(매수)
                    }
                }
            } else if (signal < 0) { // 매도
                side = API_CODE.ASK;
                const volume = accountInfo.find(item => item.currency === 'ETH')?.balance;
                console.info('[UPBIT-TRADING-BOT][-TRADE-] SELL VOLUME : ', volume);
                
                orderReqParam = {
                    market : market,
                    side : side,
                    volume : volume,
                    ord_type : 'market' // 시장가 주문(매도)
                }
            }
            // 주문
            result = await executeOrder(orderReqParam);
        }

        return result;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-TRADE-] TRADE ERROR :: ', e);
        return e;
    }
}

module.exports = { executeTrade }