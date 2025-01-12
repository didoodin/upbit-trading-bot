const { getCandle } = require('../service/candle-service');

// 분(Minute) 캔들
const minute = getCandle;

module.exports = { minute };