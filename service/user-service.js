const readline = require('readline');
const { selectUserById } = require('../utils/supabase');
const { startInterval } = require('../utils/interval-manager');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function start() {
    try {
        // 사용자 입력 받기
        const userId = await getInputId();

        // 사용자 조회
        await selectUserById(userId);

        // 봇 실행
        startInterval(userId);
      } catch (e) {
        console.error("[UPBIT-TRADING-BOT] START ERROR : ", e);
      }
};

const getInputId = async (req, res) => {
    return new Promise((resolve, reject) => {
      rl.question('[UPBIT-TRADING-BOT] ENTER YOUR ID : ', (answer) => {
        if (answer) {
          resolve(answer); // 입력값을 resolve
        } else {
          reject(new Error('[UPBIT-TRADING-BOT] NO ID ENTERED'));
        }
      });
    });
}

module.exports = { start }