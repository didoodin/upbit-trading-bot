const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const queryEncode = require("querystring").encode;

const { UPBIT_ACCESS_KEY: ACCESS_KEY, UPBIT_SECRET_KEY: SECRET_KEY } = require('../common/env-config');

  function makeJwtToken(req) {
    let payload = {};
    let queryHash = "";
    let authToken = "";
    let jwtToken = "";

    try {
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