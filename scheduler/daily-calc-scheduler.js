const supabase = require('../utils/supabase');
const { dayjs, getYesterdayDate } = require('../utils/date-utils');
let isRun = false;

async function runDailyCalcScheduler() {
  try {
      await dailyCalcScheduler();
  } catch (e) {
      console.error("[UPBIT-TRADING-BOT] ERROR DAILY SCHEDULER: ", e);
  }
}

const dailyCalcScheduler = async () => {
  const now = dayjs().tz('Asia/Seoul');
  const targetTime = now.clone().set('hour', 9).set('minute', 0).set('second', 0).set('millisecond', 0);  // 오늘 아침 9시로 설정

  // 이미 목표 시간이 지났으면 내일 시간으로 설정
  if (now.isAfter(targetTime)) {
      targetTime.add(1, 'day');
  }

  // 대기 시간 세팅
  const timeUntilTarget = targetTime.diff(now);

  // 목표 시간까지 기다린 후 실행
  setTimeout(async () => {
    if (!isRun) {
      console.info('[UPBIT-TRADING-BOT][SCHEDULER] ********** DAILY CALCULATION SCHEDULER START ********** ');
      await getDailyCalcution(); 
      isRun = true; 
      console.info('[UPBIT-TRADING-BOT][SCHEDULER] ********** DAILY CALCULATION SCHEDULER STOP ********** ');
    }

    // 이후 매일 정해진 시간에 반복 실행
    setInterval(async () => {
      await getDailyCalcution(); 
    }, 24 * 60 * 60 * 1000);
  }, timeUntilTarget);
}

/**
 * 일별 정산 스케줄러
 * @param {*} req 
 * @param {*} res 
 */
const getDailyCalcution = async (req, res) => {
    // 어제 날짜 기준 정산 통계
    const tradeDt = await getYesterdayDate();
    const dailyCalcStat = await supabase.selectTradeHistByTradeDt(tradeDt);

    if (dailyCalcStat) {
      // 중복 체크
      const count = await supabase.selectDailyCalcStatByTradeDt({ tradeDt : dailyCalcStat.trade_dt });

      if (!count) {
        await supabase.insertDailyCalcStat({ tradeDt : dailyCalcStat.trade_dt, totalPrice : dailyCalcStat.total_price });
        console.info('[UPBIT-TRADING-BOT][SCHEDULER] INSERT DAILY CALC STAT SUCCESS');
      }
    }
}

module.exports = { runDailyCalcScheduler }