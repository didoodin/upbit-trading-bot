// .env
require("dotenv").config();
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

// lib
const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { v4: uuidv4 } = require("uuid");
const uuid = uuidv4();

module.exports = { axios, crypto, jwt, uuid, ACCESS_KEY, SECRET_KEY };


