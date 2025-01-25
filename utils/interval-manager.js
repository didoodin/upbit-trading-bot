let intervalId = {};

function startInterval(userId) {
    console.error("[UPBIT-TRADING-BOT] START BOT");
    intervalId = setInterval(() => {
        (async () => {
            const tradeService = require('../service/trade-service');
            await tradeService.executeTrade(userId);  // 비동기 함수는 async로 래핑하여 호출
        })();
    }, process.env.interval);
};

function stopInterval() {
    clearInterval(intervalId);
    process.exit(0); // 서버 종료
}

module.exports = { startInterval, stopInterval }