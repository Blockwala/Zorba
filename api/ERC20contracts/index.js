var express = require('express');
var router = express.Router();

contracts = require('./controller.js');
const auth = require('../auth');


// GET
router.get('/getContractBalance/:contract_address/:user_address', auth.required, contracts.getContractBalance);
router.get('/getTicker/:contract_address', auth.required, contracts.getTickerOfCoin);
router.get('/getName/:contract_address', auth.required, contracts.getNameOfCoin);
router.get('/getDecimals/:contract_address', auth.required, contracts.getDecimalOfCoin);
router.get('/getTransactions/:contract_address/:user_address', auth.required, contracts.getTransactionsFromContractForUser);
router.get('/getAccount', auth.required, contracts.getAccount);


module.exports = router;