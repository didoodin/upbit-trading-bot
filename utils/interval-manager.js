let intervalId = {};

function startInterval(userId) {
    intervalId = setInterval(() => {
        (async () => {
            const tradeService = require('../service/trade-service');
            await tradeService.executeTrade(userId);  // 비동기 함수는 async로 래핑하여 호출
        })();
    }, process.env.interval);

    require('../scheduler/daily-calc-scheduler').runDailyCalcScheduler();
};

function stopInterval() {
    clearInterval(intervalId);
    process.exit(0); // 서버 종료
}

module.exports = { startInterval, stopInterval }