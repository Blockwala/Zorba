var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
// var erc20Txdb = require("../dba/erc20Txdb.js").erc20TxOperations
var MongoClient = require('mongodb').MongoClient;
const request = require('request');
var erc20_live_tokens = require('./erc20_live_tokens.json');

var bucket_size = 20000;

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

			console.log(">>>>2 " + response)
			latestBlockNumber = Number(response);
			
			if(latestBlockNumber == undefined) {
				error_script("last block is null");
			}else {
				blockNumbers = [];
				for(index = latestBlockNumber - bucket ; index <= latestBlockNumber; index++) { //loop on tx count
		        	blockNumbers.push(index);
		        }

		        async.eachSeries(blockNumbers, function (_blockNumber, callback_outer) {
		        	getTransactionFromBlock(_blockNumber)
		        		.then(function(response) {
		        			console.log("Successful execution");
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
	return web3_helper.getTransactionCount(_blockNumber)
	    .then(function(count) {

	    	console.log("count is "+count);
	    	indexes = [];

	        for(index = 0 ; index <= count; index++) { //loop on tx count
	        	indexes.push(index);
	        }


	        async.eachSeries(indexes, function(_index, callback_outer) {
		        	var task =	function(callback_inner) {
		        					web3_helper.getTransactionFromBlock(_blockNumber, _index)
						 			 //get tx at index
						            .then(function(tx) {
						            	// console.log(tx)
						            	if(tx != null && tx != undefined && tx.to != null) {
						            		txs.push(tx);
						            	}
						            	callback_inner();
						            })
						            .catch(function(err){
						            	console.log(err);
						            	callback_inner();
						            });
						        }
		        	
		            asyncTasks.push(task);
		            callback_outer();
	        	}, function(err, results) {
				    if( err ) {
				      console.log(err);
				      reject(err);
				    } else {
					  //Run all tasks in parallel
					  async.parallel(asyncTasks, function(err, results) {
						    if( err ) {
						      console.log(err);
						      throw err;
						    } else {
						      getAllValidTransactions(txs);
						    }
						}, function(err, results) {
							if(err) {
								return err;
							}
							return results;
						});
				    }
			});
	    })
	    .catch(console.log);
}


/***


filters out all invalid transactions. A transactio is INVALID ethereum transfer transaction if:

1 -> tx is null
2 -> tx object is undefined
3 -> to parameter of tx object is undefined
4 -> value parameter of tx object is undefined
5 -> value parameter of tx object is 0


Otherwise its a valid ethereum transfer transaction and should be included in the result.
****/

getAllValidTransactions = function(lastMinedTxs) {

	var liveErc20TokenAddresses = _.map(erc20_live_tokens, 'address');

	//shortlist non erc20 tx from list of erc20 address we have
	var regularTxs = _.filter(lastMinedTxs, function(tx) {
		if (tx == null || tx == undefined || tx.to == undefined || tx.value == undefined || tx.value == 0) {
			return false;
		}
		console.log(tx.to);
		console.log(tx.value);
		console.log(tx.hash);
		return (_.indexOf(liveErc20TokenAddresses, tx.to.toString()) <= -1);
	});

	// console.log('---------------------filter txs on value');

	// var regularTxs = _.filter(regularTxs, function(tx) {
	// 	console.log(tx.value);
	// 	return tx.value != undefined ;
	// })

	console.log('---------------------shortlisted txs');
	console.log(regularTxs[0])

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

Scan over all the events returned from ethereum chain

and push them to mongo db

@Params

arrayOfEvents : Array of events returned form Ethereum

***/
scan_and_migrate = function(arrayOfEvents, symbol) {
	p("-------Received Events")
	p(symbol)
	async.eachSeries(arrayOfEvents, function(event, callback) {
		// p(event)
		if(symbol != undefined) {
			event['symbol'] = symbol;
		}
		p(event.transactionHash)
		dbo.collection("transfers")//.insertOne(event)
		.update({'transactionHash': event.transactionHash}, event, {upsert: true})
		.then(function(response) {
			callback();
		})
		.catch(function(error) {
			p(error)
		})
	})
}


