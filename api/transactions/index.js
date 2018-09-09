var express = require('express');
var router = express.Router();

transactions = require('./controller.js');
const auth = require('../auth');

router.get('/getEthereumState', auth.required, transactions.getState);
router.post('/broadcastTxs', auth.required, transactions.broadcastTxs);

module.exports = router;