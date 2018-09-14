require('newrelic');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const config = require('config');
require('./model/Users');
require('./config/passport');

var usersRouter = require('./api/users/index');
var addressApiRouter = require('./api/address/index')
var contractERC20ApiRouter = require('./api/ERC20contracts/index')
var transactionsRouter = require('./api/transactions/index')
global.Promise=require("bluebird")

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/wallet/users', usersRouter);
app.use('/wallet/address', addressApiRouter);
app.use('/wallet/erc20_contracts', contractERC20ApiRouter);
app.use('/wallet/transactions', transactionsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var Mongoose = Promise.promisifyAll(require("mongoose"));

Mongoose.connect(config.mongo)
	.then(function(response) {
		console.log("MONGO DB STATUS "+ response)
	})
	.catch(function(err) {
        console.log("error "+JSON.stringify(err))
    });

module.exports = app;
