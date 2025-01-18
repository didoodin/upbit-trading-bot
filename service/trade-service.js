const { getAccounts } = require('../service/account-service');
const { getTicker } = require('../service/ticker-service');
const { getCandle } = require('../service/candle-service');
const { makeRsi, makeBB } = require('../service/indicator-service');
const { checkSignal } = require('../service/signal-service');
const { calculateVolume, executeOrder } = require('../service/order-service');
const supabase = require('../utils/supabase');

const { ROUTE, API_CODE } = require('../common/constants');
const COUNT = 200;
const KRW = 'KRW';

const executeTrade = async (req, res) => {
    const userId = req;
    let reqParam = {};
    let result = '';

    try {
        let market = '';
        let period = '';
        let candle = {};

        // 사용자 주문 요청 정보 조회
        const orderRequest = await supabase.selectOrderRequestbyId(userId);
        
        if (orderRequest) {
            market = KRW + '-' + orderRequest.market;
            period = orderRequest.period;

            // 캔들 조회
            candle = await getCandle({ minutes: period, market: market, count: COUNT });
        }

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
        console.info('[UPBIT-TRADING-BOT][-TRADE-] SIGNAL : ', signal);

        if (signal != 0) {
            console.info('[UPBIT-TRADING-BOT][-TRADE-] ORDER INFO SETTING START !!');
            const side = signal > 0 ? API_CODE.BUY : API_CODE.SELL;

            // 계좌 조회
            let accountInfo = await getAccounts({});

            if (signal > 0) { // 매수
                const balance = accountInfo.find(item => item.currency === KRW)?.balance;
                console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] BALANCE : ', balance);

                // 주문 금액 계산
                price = await calculateVolume({ side : side, accountBalance : balance, entryPrice : currentPrice });
                console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] BUY PRICE : ', price);

                if (price !== 0) { // 최소 주문 금액 이하 시 0이 리턴
                    reqParam = {
                        market : market,
                        side : side,
                        price : price.toString(),
                        ord_type : 'price' // 시장가 주문(매수)
                    }
                
                    result = await executeOrder(reqParam); // 매수
                } else {
                }
            } else if (signal < 0) { // 매도
                const accountMarket = market.replace((KRW + '-'), '');
                const volume = accountInfo.find(item => item.currency === accountMarket)?.balance;
                console.info('[UPBIT-TRADING-BOT][-TRADE-][SELL] VOLUME : ', volume);
                
                reqParam = {
                    market : market,
                    side : side,
                    volume : volume,
                    ord_type : 'market' // 시장가 주문(매도)
                }

                result = await executeOrder(reqParam); // 매수
            }

            console.info('[UPBIT-TRADING-BOT][-TRADE-] ORDER WAITING !!');
        }

        return result;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-TRADE-] ERROR : ', e);
        require('../utils/interval-manager').stopInterval();
        return e;
    }
}

module.exports = { executeTrade }