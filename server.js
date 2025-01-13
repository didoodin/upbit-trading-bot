const app = require('express');
const express = app();
const port = 3000;

const morgan = require('morgan');
const logger = require('./common/logger'); // Winston 로거 가져오기

// json
express.use(app.json());

// log
express.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// router
const { ROUTE } = require('./common/constants');
express.use(ROUTE.asset.route, require('./routes/asset'));
express.use("/", require('./routes/ticker'));
express.use(ROUTE.candles.route, require('./routes/candle'));
express.use(ROUTE.indicators.route, require('./routes/indicator'));
express.use(ROUTE.orders.route, require('./routes/order'));

express.listen(port, () => {
  console.log(" ################################################## ");
  console.log(` [UPBIT-TRADING-BOT] SERVER START || PORT : ${port} `);
  console.log(" ################################################## ");
});