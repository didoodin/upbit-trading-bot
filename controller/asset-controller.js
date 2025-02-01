const { getAccounts } = require('../service/account-service');

// 전체 계좌 조회
const accounts = async (req, res) => {
    try {
        const data = await getAccounts(req, res); 
        return res.json(data);
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] ACCOUNT ERROR :', e.message);
        return res.json(e);
    }
};

module.exports = { accounts };