const { supabase } = require('../common/env-config');

/**
 * 사용자 조회
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const selectUserById = async (req, res) => {
    const userId = req;
  
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
    const userId = req;

    const { data, error } = await supabase
    .from('tb_user')
    .update({ login_dt : new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString() })
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
const selectOrderRequestbyId = async (req, res) => {
    const userId = req;

    const { data, error } = await supabase
    .from('tb_order_request')
    .select('*')
    .eq('user_id', userId)
    .single();

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

module.exports = { selectUserById, updateLoginDtById, selectOrderRequestbyId, selectCommonConfig };