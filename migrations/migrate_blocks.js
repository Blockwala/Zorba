var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
// var erc20Txdb = require("../dba/erc20Txdb.js").erc20TxOperations
var MongoClient = require('mongodb').MongoClient;
const request = require('request');
var erc20_live_tokens = require('./erc20_live_tokens.json');

var bucketSize = 1000000;
var differential = 23000; //keep it 0 for first time run

var dbo;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");

  	shall_we_begin(); //Khalisi will burn the world
  }
});


shall_we_begin = function() {
	web3_helper.getBlockNumber()
		.then(function(response) {
			console.log(">>>>2 " + response)
			blockNumber = Number(response) - differential;
			migrateTillBlockNumber = blockNumber - bucketSize;

			async.whilst(
			    function() { return blockNumber > migrateTillBlockNumber; },
			    function(callback) {
			        web3_helper.getBlock(blockNumber, false)
						.then(function(response) {

							response = to_lower_case(response);

							dbo.collection("blocks")
								.update({'number': response.number}, response, {upsert: true})
								.then(function(response) {
									blockNumber--;
									callback();
								})
								.catch(function(error) {
									console.log(error);
								})

						})
						.catch(function(error) {
							console.log(error);
						})
			    },
			    function (err, n) {
			        // 5 seconds have passed, n = 5
			        console.log("done")
			    });
	});
}

to_lower_case = function(obj) {
	for (var k in obj){
	    if (typeof obj[k] == "object" && obj[k] !== null)
	        to_lower_case(obj[k]);
	    else if(typeof obj[k] == "string") {
			obj[k] = obj[k].toLowerCase();
		}
	}
	return obj;
}