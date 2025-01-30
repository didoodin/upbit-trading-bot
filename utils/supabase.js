const { API_CODE } = require('../common/constants');
const { supabase } = require('../common/env-config');
let userId = '';

/**
 * 사용자 조회
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const selectUserById = async (req, res) => {
    userId = req;
  
    const { data, error } = await supabase
      .from('tb_user')
      .select('*')
      .eq('user_id', userId);
  
      if (error) {
        console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
        return null;
      }

      await updateLoginDtById(userId);
      
      return data;
};

/**
 * 로그인 일자 갱신
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateLoginDtById = async (req, res) => {
    const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString();
    const userId = req;

    const { data, error } = await supabase
    .from('tb_user')
    .update({ login_dt : now })
    .eq('user_id', userId);

    if (error) {
        console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
        return null;
    }
    
    return data;
};

/**
 * 주문 요청 정보 조회
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const selectTradeInfo = async (req, res) => {
  let data, error;

  if (req.useYn && req.market) {
    ({ data, error } = await supabase
      .from('tb_trade_info')
      .select('*')
      .eq('user_id', userId)
      .eq('market', req.market)
      .eq('use_yn', req.useYn)
      .eq('fix_yn', 'N'));
  } else if (req.useYn) {
    ({ data, error } = await supabase
      .from('tb_trade_info')
      .select('*')
      .eq('user_id', userId)
      .eq('use_yn', req.useYn)
      .eq('fix_yn', 'N'));
  } else if (req.useYn) {
    ({ data, error } = await supabase
      .from('tb_trade_info')
      .select('*')
      .eq('user_id', userId)
      .eq('use_yn', req.useYn));
  } else {
    ({ data, error } = await supabase
      .from('tb_trade_info')
      .select('*')
      .eq('user_id', userId));
  }

  if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
  }
    
    return data;
};

/**
 * 주문 정보 테이블 갱신
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateTradeInfo = async (req, res) => {
  const { info_seq, market, period } = req;

  const { data, error } = await supabase
  .from('tb_trade_info')
  .update({
    market: market,
    period: period,
    use_yn: 'N',
    upd_dt: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
  })
  .eq('info_seq', info_seq)
  .eq('user_id', userId);

  if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
  }
  
  return data;
};

/**
 * 주문 요청 정보 사용여부 갱신
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateTradeInfoUseYn = async (req, res) => {
  const { data, error } = await supabase
  .from('tb_trade_info')
  .update({
    use_yn: req.useYn,
    upd_dt: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString(), 
  })
  .eq('market', req.market)
  .eq('user_id', userId);

  if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
  }
  
  return data;
};

/**
 * 예비 주문 정보 테이블 조회
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const selectWaitTradeInfo = async (req, res) => {
  const { data, error } = await supabase
    .from('tb_wait_trade_info')
    .select('*')
    .eq('user_id', userId);

    if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
    }
    
    return data;
};

/**
 * 주문 정보 갱신
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateWaitTradeInfo = async (req, res) => {
  const { info_seq, market, period } = req;

  const { data, error } = await supabase
  .from('tb_wait_trade_info')
  .update({
    market: market,
    period: period,
    upd_dt: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
  })
  .eq('info_seq', info_seq)
  .eq('user_id', userId);

  if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
  }
  
  return data;
};

/**
 * 체결 이력 추가
 * @param {*} req 
 * @param {*} res 
 */
const insertTradeHist = async (req, res) => {
  const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString();
  const { data, error } = await supabase
    .from('tb_trade_hist')
    .insert([
      {
        user_id: userId, // 사용자 ID
        market: req.market, // 거래 시장
        type: req.type, // 거래 유형
        price: req.price, // 거래 단가
        fee: req.fee, // 수수료
        amount: req.amount, // 거래 총액,
        desc: req.desc,
        close_yn: req.closeYn,
        trade_dt : now,
        reg_dt : now,
        upd_dt : null
      },
    ]);

    if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
    }

    return data;
};

/**
 * 체결 이력 완료 상태 갱신
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateCloseYnFromTradeHist = async (req, res) => {
  const { market } = req;

  const { data, error } = await supabase
  .from('tb_trade_hist')
  .update({
    close_yn: 'Y',
    upd_dt: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
  })
  .eq('market', market)
  .eq('type', 'BUY')
  .eq('close_yn', null);

  if (error) {
      console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
      return null;
  }
  
  return data;
};

/**
 * 공통 환경설정 조회
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const selectCommonConfig = async (req, res) => {
  const configKey = req;

  const { data, error } = await supabase
    .from('tb_common_config')
    .select('config_value')
    .eq('config_key', configKey)
    .eq('use_yn', 'Y')
    .single();

  if (error) {
    console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
    return null;
  }
  
  return data.config_value;
};

/**
 * 체결 이력 특정 날짜 통계
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const selectTradeHistByTradeDt = async (tradeDt) => {
  const { data, error } = await supabase
  .rpc('select_trade_hist_by_trade_dt', { _trade_dt: tradeDt })
  .single();

  if (error) {
    console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
    return null;
  }

  return data;
};

/**
 * 일별 정산 통계 중복 체크
 */
const selectDailyCalcStatByTradeDt = async (req, res) => {
    const { data, error } = await supabase
    .from('tb_daily_calc_stat')
    .select('*', { count: 'exact' })
    .eq('trade_dt', req.tradeDt);

  if (error) {
    console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
    return null;
  } 

  return data[0];
};

/**
 * 일별 정산 통계 추가
 */
const insertDailyCalcStat = async (req, res) => {
  const { data, error } = await supabase
    .from('tb_daily_calc_stat')
    .insert([
      {
        trade_dt: req.tradeDt,
        total_price: req.totalPrice
      },
    ]);

  if (error) {
    console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
    return null;
  } 

  return data;
};

module.exports = {
  insertDailyCalcStat,
  insertTradeHist,
  selectCommonConfig,
  selectDailyCalcStatByTradeDt,
  selectTradeHistByTradeDt,
  selectTradeInfo,
  selectUserById,
  selectWaitTradeInfo,
  updateLoginDtById,
  updateTradeInfo,
  updateTradeInfoUseYn,
  updateWaitTradeInfo,
  updateCloseYnFromTradeHist
};
