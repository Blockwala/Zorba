var address = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');
var async = require('async');

/**

Get Ethereum Balance

**/
address.getBalance = function(req, res) {
	var address_from_api = req.params.address;

	web3_helper.getBalance(address_from_api)
		.then(function(balance) {
			response = { "balance": balance }
			res.status(200).send(response);
		})
		.catch(function(error) {
	 		res.status(500).send({message: JSON.stringify(error)});
		});
}


/****

GET TRANSACTIONS

Last n blocks are queried from ethereum parity

These blocks are traversed and matched for address' transactions

Block query is sequential : This one is good for data migration 

especially sequential query guarntees thousands of scan

Pro: good for migration

***/

address.getTransactionsByAccount = function(req, res) {
	var myAccountAddress = req.query.address;
	var startBlockNumber = req.query.start_block;
	var endBlockNumber = req.query.end_block;

	console.log("myAccountAddress "+myAccountAddress);
	console.log("startBlockNumber "+startBlockNumber);
	console.log("endBlockNumber "+endBlockNumber);

	async.auto({
		get_end_block: function(callback) {
			console.log(">>>>>1")
			if(endBlockNumber == null) {
				console.log(">>>>>2")
				web3_helper.getBlockNumber()
					.then(function(block) {
						console.log(">>>>>3")
						endBlockNumber = block;
						callback(null, endBlockNumber);
					})
			}else {
				console.log(">>>>>4")
				callback(null, endBlockNumber);
			}
		},

		get_start_block: ['get_end_block', function(endBlockResponse, callback) {
			var endblockNumberLocal = endBlockResponse.get_end_block;
			console.log(endblockNumberLocal)
			console.log(startBlockNumber)
			if(startBlockNumber == null) {
				startBlockNumber = endblockNumberLocal - 1000;
			}
			callback(null, startBlockNumber);
		}],

		get_transactions: ['get_start_block', function(results, callback) {
			console.log(results)

			var startBlockNumber = results.get_start_block;
			var endBlockNumber = results.get_end_block;
			var blockNumbers = [];
			console.log("startBlockNumber "+startBlockNumber);
			console.log("endBlockNumber "+endBlockNumber);

			for (var i = startBlockNumber; i <= endBlockNumber; i++) {
			    if (i % 10 == 0) {
			      console.log("Searching block " + i);
			    }
			    blockNumbers.push(i);
	  		}

	  		async.eachSeries(blockNumbers, function(blockNumber, callback_inner) {
	  			web3_helper.getBlock(blockNumber, true)
		  			.then(function(block) {
		  				console.log(block.number)
			  			if (block != null && block.transactions != null) {
					      block.transactions.forEach( function(tx) {
					        if (myAccountAddress == "*" || myAccountAddress == tx.from || myAccountAddress == tx.to) {
					          console.log("  tx hash          : " + tx.hash + "\n"
					            + "   nonce           : " + tx.nonce + "\n"
					            + "   blockHash       : " + tx.blockHash + "\n"
					            + "   blockNumber     : " + tx.blockNumber + "\n"
					            + "   transactionIndex: " + tx.transactionIndex + "\n"
					            + "   from            : " + tx.from + "\n" 
					            + "   to              : " + tx.to + "\n"
					            + "   value           : " + tx.value + "\n"
					            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
					            + "   gasPrice        : " + tx.gasPrice + "\n"
					            + "   gas             : " + tx.gas + "\n"
					            + "   input           : " + tx.input);
					        }
					      })
					    }else {
					    	console.log("not found in block ");
					    }
			  			callback_inner();
		  			})
		  			.catch(function(err) {
		  				console.log(err);
		  				callback_inner();
		  			})
	  		}, function(err) {
			    // if any of the file processing produced an error, err would equal that error
			    if( err ) {
			      console.log(err);
			      throw err;
			    } else {
			      callback(null, startBlockNumber);
			    }
			})
		}]
	}, function(err, results) {
	    if(err) {
	    	   console.log('err = ', err);
	    	res.status(500).send({message: JSON.stringify(err)});
	    }

	     console.log('results = ', results);
	    res.status(200).send(JSON.stringify(results));

	})
}


/****

GET TRANSACTIONS

Parallel block queries can be much faster to query

JS Ninjas will understand the asynchronous code below

This snippet is 100X faster than above code (tested for upto 1000 blocks)

but we will not rely on it to get entire TX history.

We have to make a central Database

Pros: for less number of block can query.

*****/
address.getTransactionsByAccountParallel = function(req, res) {
	var myAccountAddress = req.query.address;
	var startBlockNumber = req.query.start_block;
	var endBlockNumber = req.query.end_block;

	console.log("myAccountAddress "+myAccountAddress);
	console.log("startBlockNumber "+startBlockNumber);
	console.log("endBlockNumber "+endBlockNumber);

	async.auto({
		get_end_block: function(callback) {
			console.log(">>>>>1")
			if(endBlockNumber == null) {
				console.log(">>>>>2")
				web3_helper.getBlockNumber()
					.then(function(block) {
						console.log(">>>>>3")
						endBlockNumber = block;
						callback(null, endBlockNumber);
					})
			}else {
				console.log(">>>>>4")
				callback(null, endBlockNumber);
			}
		},

		get_start_block: ['get_end_block', function(endBlockResponse, callback) {
			var endblockNumberLocal = endBlockResponse.get_end_block;
			console.log(endblockNumberLocal)
			console.log(startBlockNumber)
			if(startBlockNumber == null) {
				startBlockNumber = endblockNumberLocal - 100;
			}
			callback(null, startBlockNumber);
		}],

		get_transactions: ['get_start_block', function(results, callback) {
			console.log(results)

			var startBlockNumber = results.get_start_block;
			var endBlockNumber = results.get_end_block;
			var asyncTasks = [];
			var blockNumbers = [];
			console.log("startBlockNumber "+startBlockNumber);
			console.log("endBlockNumber "+endBlockNumber);

			for (var i = startBlockNumber; i <= endBlockNumber; i++) {
			    if (i % 10 == 0) {
			      console.log("Searching block " + i);
			    }
			    blockNumbers.push(i);
	  		}

	  		async.eachSeries(blockNumbers, function(blockNumber, callback_outer) {
	  			 var task = function(callback_inner) {
			    				console.log("getting block " + JSON.stringify(blockNumber))
					    		web3_helper.getBlock(blockNumber, true)
					  			.then(function(block) {
					  				console.log("response came for " + JSON.stringify(block.number))
						  			if (block != null && block.transactions != null) {
						  			  var tx = [];	
								      block.transactions.forEach( function(tx) {
								        if (myAccountAddress == "*" || myAccountAddress == tx.from || myAccountAddress == tx.to) {
								          data = "  tx hash          : " + tx.hash + "\n"
								            + "   nonce           : " + tx.nonce + "\n"
								            + "   blockHash       : " + tx.blockHash + "\n"
								            + "   blockNumber     : " + tx.blockNumber + "\n"
								            + "   transactionIndex: " + tx.transactionIndex + "\n"
								            + "   from            : " + tx.from + "\n" 
								            + "   to              : " + tx.to + "\n"
								            + "   value           : " + tx.value + "\n"
								            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
								            + "   gasPrice        : " + tx.gasPrice + "\n"
								            + "   gas             : " + tx.gas + "\n"
								            + "   input           : " + tx.input;
								            console.log(data)
								            tx.append(data)
								        }
								      })
								    }else {
								    	console.log("not found in block ");
								    }
						  			callback_inner(null, tx);
		  						})
		  						.catch(function(error) {
		  							console.log(">>>>>")
		  							console.log(error)
		  							callback_inner(null, [])
		  						})
			    		}
			    asyncTasks.push(task);
			    callback_outer();
	  		}, function(err) {
			    if( err ) {
			      console.log(err);
			      throw err;
			    } else {
				    async.parallel(asyncTasks, function(err, results) {
					    if( err ) {
					      console.log(err);
					      throw err;
					    } else {
					      console.log(results)
					      callback(null, results);
					    }
					});	 
			    }
			})
		}]
	}, function(err, results) {
	    if(err) {
	    	   console.log('err = ', err);
	    	res.status(500).send({message: JSON.stringify(err)});
	    }

	     console.log('results = ', results);
	    res.status(200).send(JSON.stringify(results));

	})
}


module.exports = address;