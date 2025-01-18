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
        rsi : {
          code: 'IA-01',
          desc: 'RSI',
          path: '/rsi',
          method: 'GET'
        },
        bb : {
          code: 'IA-02',
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
      BUY : 'bid', // 매수
      SELL : 'ask' // 매도
    }
  }
