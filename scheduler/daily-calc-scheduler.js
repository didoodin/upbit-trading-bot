const schedule = require('node-schedule');
const supabase = require('../utils/supabase');
const { getYesterdayDate } = require('../utils/date-utils');

module.exports.dailyScheduler = async () => {
  schedule.scheduleJob('0 9 * * *', async () => {
    console.info('[UPBIT-TRADING-BOT][SCHEDULER] ********** DAILY CALCULATION SCHEDULER START ********** ');
    try {
      await getDailyCalcution();
    } catch (e) {
      console.error('[UPBIT-TRADING-BOT][SCHEDULER] DAILY CALCULATION SCHEDULER ERROR : ', e);
    }
    console.info('[UPBIT-TRADING-BOT][SCHEDULER] ********** DAILY CALCULATION SCHEDULER END ********** ');
  });
};

/**
 * 일별 정산 스케줄러
 * @param {*} req 
 * @param {*} res 
 */
const getDailyCalcution = async (req, res) => {
    // 어제 날짜 기준 정산 통계
    const tradeDt = getYesterdayDate();
    console.info(tradeDt)
    const dailyCalcStat = await supabase.selectTradeHistByTradeDt(tradeDt);

    // 통계 데이터 추가
    if (dailyCalcStat) {
      await supabase.insertDailyCalcStat({ tradeDt : dailyCalcStat[0].trade_dt, totalPrice : dailyCalcStat[0].total_price });
    }
}