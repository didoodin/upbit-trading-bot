const { getIndicator } = require('../service/indicator-service');
const { executeTrade } = require('../service/trade-service');

// RSI
const rsi = async (req, res) => {
    try {
        const data = await getIndicator(req, res); 
        return res.json(data);
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] RSI ERROR :', e.message);
        return res.status(500).json({ error: e.message });
    }
};
// BB
const bb = async (req, res) => {
    try {
        const data = await getIndicator(req, res); 
        return res.json(data);
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] BB ERROR :', e.message);
        return res.status(500).json({ error: e.message });
    }
};

// 테스트
const trade = executeTrade;

module.exports = { rsi, bb, trade };