const _ = require('lodash');
const math = require('mathjs');

const { ROUTE } = require('../common/constants');
const api = ROUTE.indicators;

const { getCandle } = require('../service/candle-service');

/**
 * 보조 지표 계산
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getIndicator = async (req, res) => {
    // console.debug('[UPBIT-TRADING-BOT][-INDICATOR-] REQ-BODY : ', req);

    const path = req._parsedUrl && req._parsedUrl.path != null ? req._parsedUrl.path : '';
    let code = '';
    let rsi = '';
    let bb = '';

    // 캔들 API 호출
    let candle = {};

    try {
      if (path) {
        console.info('[UPBIT-TRADING-BOT][-INDICATOR-] TYPE : [API]');

        switch (path) {
          case api.rsi.path:
            code = api.rsi.code;
            break;
          case api.bb.path:
            code = api.bb.code;
            break;
        }

        candle = await getCandle(req);

        if (!candle) {
          console.error('[UPBIT-TRADING-BOT][-INDICATOR-] CANDLE IS NULL');
          return null;  // candle이 없으면 null 반환
        }

      } else {
        console.info('[UPBIT-TRADING-BOT][-INDICATOR-] TYPE : [TRADE]');

        code = req.filter(item => item.code).map(item => item.code)[0];
        candle = req.filter(item => !item.code); // code 속성이 없는 항목만 필터링

        if (!candle) {
          console.error('[UPBIT-TRADING-BOT][-INDICATOR-] CANDLE IS NULL');
          return null;  // candle이 없으면 null 반환
        } 
      }

      switch (code) {
        case api.rsi.code: // RSI
            console.info(`[UPBIT-TRADING-BOT][-INDICATOR-][RSI][${code}] MAKE RSI START`);
            rsi = await makeRsi(candle);
            console.info(`[UPBIT-TRADING-BOT][-INDICATOR-][RSI][${code}] RSI : ${rsi}`);
            return rsi;
        case api.bb.code: // BB
            console.info(`[UPBIT-TRADING-BOT][-INDICATOR-][BB][${code}] MAKE BB START`);
            bb = await makeBB(candle);
            console.info(`[UPBIT-TRADING-BOT][-INDICATOR-][BB][${code}] ${bb}`);
            return bb;
        }

      return { rsi: rsi, bb: bb };
    } catch (e) {
      console.error('[UPBIT-TRADING-BOT][-INDICATOR-] ERROR : ', e);
      return e;
    }
  }

/**
 * RSI 계산
 * @param {*} candleList 
 * @returns 
 */
async function makeRsi(candleList) {
    console.info('[UPBIT-TRADING-BOT][-INDICATOR-] RSI CHECK');

    try {
        if (!candleList || candleList.length === 0) {
            return null;
          }
      
          // 지수 이동 평균은 과거 데이터부터
          candleList.sort((a, b) => a.timestamp - b.timestamp); // 오름차순 (과거 순)
      
          const zero = 0;
          let upList = [];  // 상승 리스트
          let downList = [];  // 하락 리스트
    
          for (let i = 0; i < candleList.length - 1; i++) {
            // 최근 종가 - 전일 종가 = gap 값이 양수일 경우 상승했다는 뜻 / 음수일 경우 하락이라는 뜻
            const gapByTradePrice = candleList[i + 1].trade_price - candleList[i].trade_price;
            
            if (gapByTradePrice > 0) {
              upList.push(gapByTradePrice);
              downList.push(zero);
            } else if (gapByTradePrice < 0) {
              downList.push(math.abs(gapByTradePrice));
              upList.push(zero);
            } else {
              upList.push(zero);
              downList.push(zero);
            }
          }
      
          const day = 14;  // 가중치를 위한 기준 일자 (보통 14일 기준)
          const a = 1 / (1 + (day - 1));  // 지수 이동 평균의 정식 공식은 a = 2 / 1 + day 이지만 업비트에서 사용하는 수식은 a = 1 / (1 + (day - 1))
        
          // AU값 (Upward EMA) 구하기
          let upEma = 0; // 상승 값의 지수이동평균
    
          if (upList.length > 0) {
            upEma = upList[0];
            for (let i = 1; i < upList.length; i++) {
              upEma = (upList[i] * a) + (upEma * (1 - a));
            }
          }
      
          // AD값 (Downward EMA) 구하기
          let downEma = 0; // 하락 값의 지수이동평균
    
          if (downList.length > 0) {
            downEma = downList[0];
            for (let i = 1; i < downList.length; i++) {
              downEma = (downList[i] * a) + (downEma * (1 - a));
            }
          }
      
          // RSI 계산
          const rs = upEma / downEma;
          const rsi = 100 - (100 / (1 + rs));
      
          return rsi;
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][-INDICATOR-] MAKE RSI ERROR');
        return e;
    }
}

/**
 * 볼린저밴드 계산
 * @param {*} candleList 
 * @returns 
 */
async function makeBB(candleList) {
    try {
        // 캔들 데이터 조회용
        const candleDatas = [];

        // 볼린저밴드 데이터 리턴용 배열
        const bbList = [];

        // 조회 횟수별 캔들 데이터 조합
        for (let i = 0; i < 10; i++) {
            candleDatas.push(candleList.slice(i, candleList.length));
        }

        // 각 캔들 데이터 세트에 대해 처리
        for (const candleDataFor of candleDatas) {
            const dfDt = candleDataFor.map(candle => candle.candle_date_time_kst).filter(candleDate => candleDate !== undefined).reverse();
            const df = candleDataFor.map(candle => candle.trade_price).filter(candleDate => candleDate !== undefined).reverse();

            // 표준편차 곱수
            const unit = 2;

            // 각 날짜마다 계산을 위해 dfDt와 df를 순차적으로 처리
            for (let i = 0; i < dfDt.length; i++) {
              // 최근 20개의 가격 데이터 추출 (현재 i번째 데이터를 포함)
              const last20Prices = df.slice(i, i + 20);

              // 평균/분산/표준편차 계산
              const mean = last20Prices.reduce((a, b) => a + b, 0) / last20Prices.length;
              const variance = last20Prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / last20Prices.length;
              const standardDeviation = Math.sqrt(variance);

              const band1 = unit * standardDeviation;
              const bbCenter = mean;
              const bandHigh = bbCenter + band1;
              const bandLow = bbCenter - band1;

              bbList.push({
                  type: 'BB',
                  DT: dfDt[i],  // 각 날짜에 해당하는 값
                  BBH: Number(bandHigh.toFixed(4)), // 상단 밴드
                  BBM: Number(bbCenter.toFixed(4)), // 중간 밴드
                  BBL: Number(bandLow.toFixed(4))   // 하단 밴드
              });
          }
        }
    
        return bbList[0];
    } catch (e) {
        console.error('[UPBIT-TRADING-BOT][- INDICATOR -] MAKE BB ERROR !!');
        console.error(e);
    }
  }

module.exports = { getIndicator, makeRsi, makeBB };