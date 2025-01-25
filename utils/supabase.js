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
const selectTradeInfoById = async (req, res) => {
    const userId = req;

    const { data, error } = await supabase
    .from('tb_trade_info')
    .select('*')
    .eq('user_id', userId)
    .eq('use_yn', 'Y');

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
        amount: req.amount, // 거래 총액
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
  const { data, error } = await supabase.rpc('select_trade_hist_by_trade_dt', { _trade_dt: tradeDt });
  if (error) {
    console.error('[UPBIT-TRADING-BOT][DB] ERROR : ', error);
    return null;
  }

  console.info('[UPBIT-TRADING-BOT][DB] Trade History Data:', data);
  return data;
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

module.exports = { selectUserById, updateLoginDtById, selectTradeInfoById, insertTradeHist, selectCommonConfig, selectTradeHistByTradeDt, insertDailyCalcStat };