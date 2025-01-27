const { call } = require('../utils/api-client');
const { ROUTE } = require('../common/constants');
const api = ROUTE.asset;
let code = '';

const getAccounts = async (req, res) => {
    let data = {};
    code = api.account.code;

    try {
        data = await call(api.account.method, api.account.path, null);
        // console.debug('[UPBIT-TRADING-BOT][-ACCOUNT-][', code, '] RES-BODY : ', data);
        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-ACCOUNT-] ERROR : ', e.message);
        return e;
    }
};

module.exports = { getAccounts }