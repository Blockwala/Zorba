var express = require('express');
var router = express.Router();

contracts = require('./controller.js');


// GET
router.get('/getContractBalance/:contract_address/:user_address', contracts.getContractBalance);
router.get('/getTicker/:contract_address', contracts.getTickerOfCoin);
router.get('/getName/:contract_address', contracts.getNameOfCoin);
router.get('/getDecimals/:contract_address', contracts.getDecimalOfCoin);
router.get('/getTransactions/:contract_address/:user_address', contracts.getTransactionsFromContractForUser);
router.get('/getAccount', contracts.getAccount);


module.exports = router;