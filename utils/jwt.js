const { ACCESS_KEY, SECRET_KEY, crypto, uuid, jwt } = require('../common/config');
const querystring = require("querystring");

const payload = {
    access_key: ACCESS_KEY,
    nonce: uuid
  };

  function makeJwtToken(body) {
    console.log("[UPBIT-TRADING-BOT][- JWT -] MAKE JWT TOKEN");

    if (body) {
      console.log("[UPBIT-TRADING-BOT][- JWT -]  MAKE QUERYSTRING START");
      const query = querystring.stringify(body);
    
      const hash = crypto.createHash('sha512');
      const queryHash = hash.update(query, 'utf-8').digest('hex');
    
      payload.query_hash = queryHash;
      payload.query_hash_alg = 'SHA512';
    } 

    const jwtToken = jwt.sign(payload, SECRET_KEY);
    const authToken = `Bearer ${jwtToken}`;

    return authToken;
  }

  module.exports = {
    makeJwtToken
}