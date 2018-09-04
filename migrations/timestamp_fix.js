var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
var erc20_live_tokens = require('./erc20_live_tokens.json');
var MongoClient = require('mongodb').MongoClient;
const request = require('request');



MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");
  	p(dbo)
  	start_parsing();
  }
});


