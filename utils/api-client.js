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
        // console.debug('[UPBIT-TRADING-BOT][-API CALL-] REQ-URL : ', url);
        // console.debug('[UPBIT-TRADING-BOT][-API CALL-] REQ-HEAD : ', headers);
        // console.debug('[UPBIT-TRADING-BOT][-API CALL-] REQ-BODY : ', options);

        const response = await axios(options);
        await getRemainReqCnt(response);
        data = response.data;

        return data;
    } catch (e) {
        // 해당 시간 내 초과된 요청에 대해서 429 Too Many Requests 오류 발생
        if (e.response && e.response.status === 429) {
            // 요청 가능 횟수 확보 위한 대기 시간
            let sleepTime = 0.3;
            
            // 요청 가능 횟수
            await getRemainReqCnt(e.response);
            await sleep(sleepTime);
        } else {
            console.error('[UPBIT-TRADING-BOT] ERROR :', e);
            return e;
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getRemainReqCnt(res) {
    let remainReqCnt = res.headers['remaining-req'];

    // 정규 표현식을 사용하여 sec 값을 추출
    const match = remainReqCnt.match(/sec=(\d+)/);

    if (match) {
        const secValue = match[1];  // sec 값
        // console.error('[-API CALL-] REMAIN REQUEST COUNT : [',secValue,']');
    }
}

module.exports = { call }