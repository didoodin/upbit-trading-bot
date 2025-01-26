const app = require('express');
const express = app();
const port = 3000;

const morgan = require('morgan');
const logger = require('./common/logger'); // Winston 로거 가져오기

const { start } = require('./service/user-service');

// json
express.use(app.json());

// log
express.use(
  morgan('combined', {
    stream: {
      write: (message) => console.info(message.trim()),
    },
  })
);

// router
const { ROUTE } = require('./common/constants');
express.use("/", require('./routes/ticker'));
express.use(ROUTE.asset.route, require('./routes/asset'));
express.use(ROUTE.candles.route, require('./routes/candle'));
express.use(ROUTE.indicators.route, require('./routes/indicator'));
express.use(ROUTE.orders.route, require('./routes/order'));

express.listen(port, () => {
  console.info(" ################################################## ");
  console.info(` [UPBIT-TRADING-BOT] SERVER START || PORT : ${port} `);
  console.info(" ################################################## ");

  start();
});