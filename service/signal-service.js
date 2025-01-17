const RSI_BUY = 30;  // 매수 RSI 임계값
const RSI_SELL = 65; // 매도 RSI 임계값
const DISTANCE = 5;  // 밴드와의 거리 임계값

const checkSignal = async (req, res) => {
    const { currentPrice, rsi, bb } = req;
    const { BBH: upperBand, BBL: lowerBand } = bb[0];

    const upperDistance = calculateDistance(upperBand, currentPrice);
    const lowerDistance = calculateDistance(currentPrice, lowerBand);

    let signal = determineSignal(rsi, upperDistance, lowerDistance);
    return signal;
};

// 거리 계산
const calculateDistance = (price1, price2) => {
    return ((price1 - price2) / price1) * 100;
};

// 신호 결정
const determineSignal = (rsi, upperDistance, lowerDistance) => {
    if (rsi < RSI_BUY && lowerDistance <= DISTANCE) {
        console.info('[UPBIT-TRADING-BOT] BUY SIGNAL !!');
        return 1; // 매수 신호
    }

    if (rsi > RSI_SELL && upperDistance <= DISTANCE) {
        console.info('[UPBIT-TRADING-BOT] SELL SIGNAL !!');
        return -1; // 매도 신호
    }

    return 0;
};

module.exports = { checkSignal };