var express = require('express');
var router = express.Router();

address = require('./controller.js');
const auth = require('../auth');

// GET
router.get('/getBalance/:address', auth.required, address.getBalance);
router.get('/getTransactions', auth.required, address.getTransactionsByAccountParallel);
router.get('/accountInformation', auth.required, address.getAccountInformation);

module.exports = router;