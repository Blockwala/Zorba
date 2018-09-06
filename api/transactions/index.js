var express = require('express');
var router = express.Router();

transactions = require('./controller.js');

router.get('/getEthereumState', transactions.getState);

module.exports = router;