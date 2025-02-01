let intervalId;

function startInterval(userId) {
    function checkAndRunInterval() {
        const currentHour = new Date().getHours();
        
        // 오전 9시 일정 스케줄러 실행
        if (currentHour === 9) {
            require('../scheduler/daily-calc-scheduler').runDailyCalcScheduler();
            
            if (!intervalId) {
                intervalId = setInterval(async () => {
                    const tradeService = require('../service/trade-service');
                    await tradeService.executeTrade(userId);
                }, process.env.interval);
            }
        }
        // 오전 9~10시, 12~13시에는 executeTrade 실행하지 않음
        else if ((currentHour >= 9 && currentHour < 10) || (currentHour >= 12 && currentHour < 14)) {
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
    clearInterval(intervalId);
    process.exit(0); // 서버 종료
}

module.exports = { startInterval, stopInterval }