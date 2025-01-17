const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const queryEncode = require("querystring").encode;

const { ACCESS_KEY, SECRET_KEY } = require('../common/config');

  function makeJwtToken(req) {
    // console.info('[UPBIT-TRADING-BOT][-JWT-] MAKE JWT TOKEN');
    // console.info('[UPBIT-TRADING-BOT][-JWT-] REQ-BODY : ', req);

    let payload = {};
    let queryHash = "";
    let authToken = "";
    let jwtToken = "";

    try {
        // console.info('[UPBIT-TRADING-BOT][- JWT -]  MAKE QUERYSTRING START');
        const query = queryEncode(req);
        const hash = crypto.createHash('sha512');
        queryHash = hash.update(query, 'utf-8').digest('hex');

        payload = {
          access_key: ACCESS_KEY,
          nonce: uuidv4(),
          query_hash: queryHash,
          query_hash_alg: 'SHA512',
        };
    
        jwtToken = jwt.sign(payload, SECRET_KEY);
        authToken = `Bearer ${jwtToken}`;

      return authToken;
    } catch (e) {
      console.error('[UPBIT-TRADING-BOT][-JWT-] ERROR : ', e);
      return e;
    }
  }

  module.exports = {
    makeJwtToken
}