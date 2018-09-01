var express = require('express');
var router = express.Router();

address = require('./controller.js');


// GET
router.get('/getBalance/:address', address.getBalance);
router.get('/getTransactions', address.getTransactionsByAccountParallel);
router.get('/accountInformation/:address', address.getAccountInformation);

module.exports = router;