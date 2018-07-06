var express = require('express');
var router = express.Router();

address = require('./controller.js');


// GET
router.get('/getBalance/:address', address.getBalance);

module.exports = router;