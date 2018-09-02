var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
var erc20_live_tokens = require('./erc20_live_tokens.json');
var MongoClient = require('mongodb').MongoClient;
const request = require('request');

var bucket_size = 100000;

//Total blocks parsed are bucket_size


var dbo;

/********

Aim:  Connect to Mongo and begin if connected

url : url of mongo DB

*******/

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");
  	p(dbo)
  	start_parsing();
  }
});

/*****

START HERE: --->

Aim: Parse the arguments frm command line
contract_address : needed argument
start_block: optional
stop_block: optional

*****/

start_parsing = function() {
	return web3_helper.getBlockNumber()
		.then(function(response) {

			console.log("BLOCK NUMBER -------------- " + response)
			latestBlockNumber = Number(response);
			
			if(latestBlockNumber == undefined) {
				error_script("last block is null");
			}else {
				blockNumbers = [];
				for(index = latestBlockNumber - bucket_size ; index <= latestBlockNumber; index++) { //loop on tx count
		        	blockNumbers.push(index);
		        }

		        async.eachSeries(blockNumbers, function (_blockNumber, callback_outer) {
		        	var waitTill = new Date(new Date().getTime() + .1 * 1000);
					while(waitTill > new Date()){}
		        	console.log("Starting for "+_blockNumber);
		        	getTransactionFromBlock(_blockNumber)
		        		.then(function(response) {
		        			console.log("Successful execution "+_blockNumber);
		        			console.log(response)
		        			callback_outer();
		        		})
		        		.catch(function(error) {
		        			console.log("Error occurred")
		        			console.log(error)
		        			callback_outer();
		        		})
		        },function(err, results) {
		        	if(err) {
		        		console.log(error);
		        		console.log("Some error occurred");
		        		return;
		        	}
		        	console.log("DONE");
		        	console.log(results);
		        });
			}
		})
		.catch(function(error) {
			error_script(error);
		})
}

/***

Pulling a block data for transactions

Step 1: Get transaction count from the block number
Step 2: make an array of indexes for these transactions
Step 3: create tasks for blocknumber and transaction index. Example if 100 tx in the block, 100 tasks will be created
Step 4: Run these tasks in PARALLEL
Step 5: return when all parallel tasks are executed

**/
getTransactionFromBlock = function(_blockNumber) {
	asyncTasks = []
	txs = []

	return web3_helper.getTransactionCount(_blockNumber)
	    .then(function(count) {

	    	console.log("count is "+count);
	    	indexes = [];

	        for(index = 0 ; index <= count; index++) { //loop on tx count
	        	indexes.push(index);
	        }

	        return new Promise(function (resolve, reject) {
	        	 async.eachSeries(indexes, function(_index, callback_outer) {
					console.log("$$$$$$$ Building transaction search " + _blockNumber + " _index "+_index)
					web3_helper.getTransactionFromBlock(_blockNumber, _index) //get tx at index

		            .then(function(tx) {
		            	// console.log(tx)
		            	if(tx != null && tx != undefined && tx.to != null) {
		            		txs.push(tx);
		            	}
		            	callback_outer();

		            })
		            .catch(function(err) {
		            	reject(err)
		            	callback_outer();

		            })}, function(err, results) {
					    if( err ) {
					      console.log(err);
					      reject(err);
					    } else {
					    	resolve(getAllValidTransactions(txs, _blockNumber));
					    }
						});
			    })
			    .catch(console.log);
	        });
	       
}


/***


filters out all invalid transactions. A transactio is INVALID ethereum transfer transaction if:

1 -> tx is null
2 -> tx object is undefined
3 -> to parameter of tx object is undefined
4 -> value parameter of tx object is undefined
5 -> value parameter of tx object is 0

6 -> to address should not be erc20 address


Otherwise its a valid ethereum transfer transaction and should be included in the result.
****/

getAllValidTransactions = function(lastMinedTxs, blockNumber) {

	console.log("###### lastMinedTxs.length "+lastMinedTxs.length)
	console.log("###### running for "+blockNumber)
	var liveErc20TokenAddresses = _.map(erc20_live_tokens, 'address');

	//shortlist non erc20 tx by running through list of erc20 address we have and looking for -ve cases
	var regularTxs = _.filter(lastMinedTxs, function(tx) {
		if (tx == null || tx == undefined || tx.to == undefined || tx.value == undefined || tx.value == 0) {
			return false;
		}
		console.log("tx.value "+tx.value)
		return (_.indexOf(liveErc20TokenAddresses, tx.to.toString()) <= -1);
	});

	console.log('---------------------shortlisted txs');
	console.log("regularTxs.length "+regularTxs.length)
	console.log("store in mongo for "+blockNumber)
	return migrate_to_mongo(regularTxs); //MONGO

}


/****

Error script called in case of an error is arisen

@Params 

error: error message

****/
error_script = function(error) {
	console.log(error);
	throw ({'error':error});
}

p = function(message) {
	console.log(message)
}

/****

Migrate shortlisted data to mongod

@Params

txs : Array of txs which are valid eth transfer tx

***/
migrate_to_mongo = function(txs) {
	return new Promise(function (resolve, reject) {

		if(txs.length == 0) resolve(null);

		var count = 1;
		_.forEach(txs, function(tx) {
			tx = to_lower_case(tx);
			console.log("=======>"+tx.hash);
			dbo.collection("transactions")//.insertOne(event)
			.update({'hash': tx.hash}, tx, {upsert: true})
			.then(function(response) {
				if(count == txs.length) {
					resolve(null);
				}	
				count ++;
			})
			.catch(function(error) {
				p(error)
			})
		})
	});
}


to_lower_case = function(obj) {
	for (var k in obj) {
	    if (typeof obj[k] == "object" && obj[k] !== null)
	        to_lower_case(obj[k]);
	    else if(typeof obj[k] == "string") {
			obj[k] = obj[k].toLowerCase();
		}
	}
	return obj;
}


