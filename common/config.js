require('dotenv').config(); // .env

const UPBIT_ACCESS_KEY = process.env.UPBIT_ACCESS_KEY;
const UPBIT_SECRET_KEY = process.env.UPBIT_SECRET_KEY;

// lib
const axios = require('axios');

// supabase
const { createClient  } = require('@supabase/supabase-js');
const supabase = createClient (process.env.DB_URL, process.env.DB_KEY);

module.exports = { axios, supabase, UPBIT_ACCESS_KEY, UPBIT_SECRET_KEY };


