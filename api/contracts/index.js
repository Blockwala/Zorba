var express = require('express');
var router = express.Router();

contracts = require('./controller.js');


// GET
router.get('/getContractBalance/:contract_address/:user_address', contracts.getContractBalance);

module.exports = router;