const { API_CODE } = require('../common/constants');
const supabase = require('../utils/supabase');

const checkSignal = async (req, res) => {
    const { currentPrice, rsi, bb } = req;
    const { BBH: upperBand, BBL: lowerBand } = bb[0];

    const upperDistance = await calculateDistance(upperBand, currentPrice);
    const lowerDistance = await calculateDistance(currentPrice, lowerBand);

    let signal = await determineSignal(rsi, upperDistance, lowerDistance);
    return signal;
};

// 거리 계산
const calculateDistance = async (price1, price2) => {
    return ((price1 - price2) / price1) * 100;
};

// 신호 결정
const determineSignal = async (rsi, upperDistance, lowerDistance) => {
    // RSI 임계값 조회
    const buy = await supabase.selectCommonConfig(API_CODE.RSI_BUY);
    const sell = await supabase.selectCommonConfig(API_CODE.RSI_SELL);

    if (rsi < buy && lowerDistance <= API_CODE.DISTANCE) {
        console.info('[UPBIT-TRADING-BOT] BUY SIGNAL !!');
        return 1; // 매수 신호
    }

    if (rsi > sell && upperDistance <= API_CODE.DISTANCE) {
        console.info('[UPBIT-TRADING-BOT] SELL SIGNAL !!');
        return -1; // 매도 신호
    }

    return 0;
};

module.exports = { checkSignal };