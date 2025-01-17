// .env
require('dotenv').config();

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

// lib
const axios = require('axios');

module.exports = { axios, ACCESS_KEY, SECRET_KEY };


