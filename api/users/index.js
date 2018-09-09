const express = require('express');
const router = express.Router();
const auth = require('../auth');
userAPIS = require('./users.js');

router.post('/login', auth.optional, userAPIS.login);
router.post('/signup', auth.optional, userAPIS.signup);
router.get('/current', auth.required,  userAPIS.current);

module.exports = router;