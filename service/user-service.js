const supabase = require('../utils/supabase');
const userId = process.env.userId;
// const readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

async function start() {
    try {
        // 사용자 입력
        // const userId = await getInputId();

        // 사용자 조회
        const isUser = await supabase.selectUserById(userId);

        if (!isUser) {
            console.error("[UPBIT-TRADING-BOT] NOT USER ->> STOP BOT");
            require('../utils/interval-manager').stopInterval();
        }

        // 봇 실행
        require('../utils/interval-manager').startInterval(userId);
      } catch (e) {
        console.error("[UPBIT-TRADING-BOT] START ERROR : ", e);
      }
};

// const getInputId = async (req, res) => {
//     return new Promise((resolve, reject) => {
//       rl.question('[UPBIT-TRADING-BOT] ENTER YOUR ID : ', (answer) => {
//         if (answer) {
//           resolve(answer); // 입력값을 resolve
//         } else {
//           reject(new Error('[UPBIT-TRADING-BOT] NO ID ENTERED'));
//         }
//       });
//     });
// }

module.exports = { start }