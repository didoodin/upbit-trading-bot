const { getTicker } = require('../service/ticker-service');

// 종목 단위 현재가 정보
const ticker = async (req, res) => {
    try {
        const data = await getTicker(req, res); 
        return res.json(data);
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] TICKER ERROR : ', e.message);
        return res.status(500).json({ error: e.message });
    }
};

module.exports = { ticker };