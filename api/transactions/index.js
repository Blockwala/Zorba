var express = require('express');
var router = express.Router();

transactions = require('./controller.js');

router.get('/getEthereumState', transactions.getState);

router.post('/broadcastTxs', transactions.broadcastTxs);

module.exports = router;