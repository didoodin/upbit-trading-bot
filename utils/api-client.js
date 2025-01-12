const { DOMAIN } = require('../common/constants');
const { makeJwtToken } = require('./jwt');
const { axios } = require('../common/config');
let authToken = "";

/**
 * upbit open api call
 * @param {*} method 
 * @param {*} endpoint 
 * @param {*} body 
 * @returns 
 */
async function call(method, endpoint, body = {}) {
    const queryString = new URLSearchParams(body).toString();
    let options = {};
    let data = {};
    
    // parameter check
    if (body) {
        options.param = body;
        authToken = makeJwtToken(body);
    } else {
        authToken = makeJwtToken(null);
    }

    // header
    const headers = {
        Authorization: authToken,
        Accept: "application/json; charset=utf-8",
    };

    const url = `${DOMAIN}${endpoint}${queryString ? `?${queryString}` : ""}`;
    console.log("[UPBIT-TRADING-BOT][- API CALL -] REQ-URL : [", url, "]");
    console.log("[UPBIT-TRADING-BOT][- API CALL -] REQ-HEADER : [", headers, "]");

    // body
    options = {
        method: method,
        url: url,
        headers: headers
    }    
    console.log("[UPBIT-TRADING-BOT][- API CALL -] REQ-BODY : [", body, "]");

    // api call
    try {
        const response = await axios(options);
        data = response.data;
    } catch (error) {
        console.error("[UPBIT-TRADING-BOT] API CONNECT ERROR :: CODE - [", error.code, "] || MESSAGE = [", error.response?.data || error.message, "]");
    }

    return data;
}

module.exports = { call }