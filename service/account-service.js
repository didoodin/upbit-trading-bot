const { ROUTE } = require('../common/constants');
const { call } = require('../utils/api-client');
const api = ROUTE.asset;
let code = '';

const getAccounts = async (req, res) => {
    let data = {};
    code = api.account.code;
    console.info('[UPBIT-TRADING-BOT][-ACCOUNT-][', code, '] START');

    try {
        data = await call(api.account.method, api.account.path, null);
        console.info('[UPBIT-TRADING-BOT][-ACCOUNT-][', code, '] RES-BODY : ', data);

        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-ACCOUNT-] ERROR : ', e.message);
        return e;
    }
};

module.exports = { getAccounts }