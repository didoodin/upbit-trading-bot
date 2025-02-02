let intervalId;

function startInterval(userId) {
    function checkAndRunInterval() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // 오전 9시 0분에 daily-calc-scheduler 실행
        if (currentHour === 9 && currentMinute === 0) {
            require('../scheduler/daily-calc-scheduler').runDailyCalcScheduler();
        }

        // 정확히 09:00 ~ 10:00, 12:00 ~ 13:00 동안 실행 중지
        if ((currentHour === 9) || (currentHour === 12)) {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
                console.log("[UPBIT-TRADING-BOT] TRADING BREAK TIME");
            }
        } else {
            // 그 외 시간대에는 executeTrade 실행
            if (!intervalId) {
                intervalId = setInterval(async () => {
                    const tradeService = require('../service/trade-service');
                    await tradeService.executeTrade(userId);
                }, process.env.interval);
            }
        }

        // 1분마다 다시 체크
        setTimeout(checkAndRunInterval, 60 * 1000);
    }

    checkAndRunInterval(); // 최초 실행
}

function stopInterval() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    process.exit(0); // 서버 종료
}

module.exports = { startInterval, stopInterval };
