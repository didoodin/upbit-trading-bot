const { DOMAIN } = require('../common/constants');
const { axios } = require('../common/env-config');
const { makeJwtToken } = require('./jwt');

/**
 * upbit open api call
 * @param {*} method 
 * @param {*} endpoint 
 * @param {*} body 
 * @returns 
 */
async function call(method, endpoint, body = {}) {
    console.info('[UPBIT-TRADING-BOT][-API CALL-] START ');
    let authToken = '';
    let url = '';
    let options = {};
    let data = {};
    
    // parameter check
    if (body) {
        authToken = makeJwtToken(body);
    } else {
        authToken = makeJwtToken(null);
    }

    // header
    let headers = { 
        Authorization: authToken,
        Accept : 'application/json; charset=utf-8'
    };

    options = {
        method: method,
        headers: headers
    }

    if (method === 'GET') {
        const queryString = new URLSearchParams(body).toString();
        url = `${DOMAIN}${endpoint}${queryString ? `?${queryString}` : ''}`;
        options.url = url;
    } else if (method === 'POST') {
        url = `${DOMAIN}${endpoint}`;
        options.url = url;
        options.data = body;
    } 

    try {
        console.debug('[UPBIT-TRADING-BOT][-API CALL-] REQ-URL : ', url);
        // console.debug('[UPBIT-TRADING-BOT][-API CALL-] REQ-HEAD : ', headers);
        console.debug('[UPBIT-TRADING-BOT][-API CALL-] REQ-BODY : ', options);

        const response = await axios(options);

        // 해당 시간 내 초과된 요청에 대해서 429 Too Many Requests 오류 발생
        if (response.status_code === 429) {
            // 요청 가능 횟수 확보 위한 대기 시간
            let sleepTime = 0.3;
            
            // 요청 가능 횟수
            let remainReqCnt = response.headers['remaining-req'];

            // 정규 표현식을 사용하여 sec 값을 추출
            const match = remainReqCnt.match(/sec=(\d+)/);

            if (match) {
                const secValue = match[1];  // sec 값
                console.error('[UPBIT-TRADING-BOT][-API CALL-] REQUEST LIMIT ->> REMAIN COUNT : ', secValue);
            }

            sleep(sleepTime);
        }

        data = response.data;

        return data;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT] API CONNECT ERROR : ', e);
        return e;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { call }