module.exports = {
    DOMAIN: 'https://api.upbit.com/v1',
    ROUTE : {
      asset : {
        route: '/asset',
        account: {
          code: 'AA-01',
          desc: '전체 계좌 조회',
          path: '/accounts',
          method: 'GET'
        }
      },
      ticker: {
        route : '/ticker',
        ableInfo : {
          code: 'TA-01',
          desc: '종목 단위 현재가 정보',
          path: '/ticker',
          method: 'GET'
        }
      },
      allMarket: {
        route : '/market',
        minute : {
          code: 'MA-01',
          desc: '종목 코드 조회',
          path: '/all',
          method: 'GET'
        }
      },
      candles: {
        route : '/candles',
        minute : {
          code: 'CA-01',
          desc: '분(Minute) 캔들',
          path: '/minutes',
          method: 'GET'
        }
      },
      indicators: {
        route : '/indicators',
        ma : {
          code: 'IA-01',
          desc: 'MA',
          path: '/ma',
          method: 'GET'
        },
        rsi : {
          code: 'IA-02',
          desc: 'RSI',
          path: '/rsi',
          method: 'GET'
        },
        bb : {
          code: 'IA-03',
          desc: 'BB',
          path: '/bb',
          method: 'GET'
        }
      },
      orders: {
        route : '/orders',
        chance: {
          code: 'OA-01',
          desc: '주문 가능 정보',
          path: '/chance',
          method: 'GET'
        },
        order: {
          code: 'OA-02',
          desc: '주문',
          path: '',
          method: 'POST'
        }
      }
    },
    API_CODE : {
      RUN_STATUS : 'run_status', // 서버 실행 여부
      BUY : 'bid', // 매수
      SELL : 'ask', // 매도
      WAIT : 'wait',
      RSI_BUY : 'rsi_buy', // 매수 RSI 임계값
      RSI_SELL : 'rsi_sell', // 매도 RSI 임계값
      DISTANCE : 5, // 밴드와의 거리 임계값
      MAX_ALLOCATION : 'max_allocation', // 계좌 대비 최대 매수 금액 비율
      TARGET_BUY_RATE : 'target_buy_rate', // 목표 매수 비율
      TARGET_SELL_RATE : 'target_sell_rate', // 목표 매도 비율
      CUT_LOSS_THRESHOLD : 'cut_loss_threshold' // 손절 기준 비율
    }
  }
