var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
// var erc20Txdb = require("../dba/erc20Txdb.js").erc20TxOperations
var MongoClient = require('mongodb').MongoClient;
const request = require('request');
var erc20_live_tokens = require('./erc20_live_tokens.json');

var bucket_size = 1000000;

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
	var blocks = []
	web3_helper.getBlockNumber()
		.then(function(response) {
			console.log(">>>>2 " + response)
			blockNumber = Number(response);
			migrateTillBlockNumber = blockNumber - bucket_size;
			while(blockNumber > migrateTillBlockNumber) {
				console.log(blockNumber);
				blocks.push(blockNumber);
				blockNumber--;
			}

			async.eachSeries(blocks, function(block, callback){
				console.log(block)
				return web3_helper.getBlock(block, false)
				.then(function(response) {

					console.log(response);
					response = to_lower_case(response);

					dbo.collection("blocks")
						.update({'blockNumber': response.blockNumber}, response, {upsert: true})
						.then(function(response) {
							callback();
						})
						.catch(function(error) {
							console.log(error);
						})

				})
				.catch(function(error) {
					console.log(error);
				})
			});
		})
		.catch(function(error) {
			error_script(error);
		})
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