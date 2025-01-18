const { getCandle } = require('../service/candle-service');

// 분(Minute) 캔들
const minute = async (req, res) => {
    try {
        const data = await getCandle(req, res); 
        return res.json(data);
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] CANDLE ERROR : ', e.message);
        return res.status(500).json({ error: e.message });
    }
};

module.exports = { minute };