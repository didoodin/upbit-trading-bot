process.env.TZ = 'Asia/Seoul';
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// 플러그인 사용 설정
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports.koreaDate = dayjs().tz('Asia/Seoul');
module.exports.koreaDateISO = dayjs().tz('Asia/Seoul').toISOString();

const getYesterdayDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1); // 어제 날짜로 설정
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(today.getDate()).padStart(2, '0'); // 두 자리로 맞추기
    
    return `${year}-${month}-${day}`;
  };

module.exports = { dayjs, getYesterdayDate }
