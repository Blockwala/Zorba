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

	  		async.eachSeries(blockNumbers, function(blockNumber, callback) {
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
			  			callback();
		  			})
		  			.catch(function(err) {
		  				console.log(err);
		  				callback();
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



// address.getTransactionsByAccount(req, res) {

// 	var myaccount = req.params.address;
// 	var startBlockNumber = req.params.start_block;
// 	var endBlockNumber = req.params.end_block;

// 	if (endBlockNumber == null) {
// 	    endBlockNumber = helper.getBlockNumber()
// 	    	.then(function(endBlockNumber) {
// 	    		  console.log("Using endBlockNumber: " + endBlockNumber);
// 	    	})
// 	}



//   if (startBlockNumber == null) {
//     startBlockNumber = endBlockNumber - 1000;
//     console.log("Using startBlockNumber: " + startBlockNumber);
//   }
//   console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);

// 	  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
// 	    if (i % 1000 == 0) {
// 	      console.log("Searching block " + i);
// 	    }
// 	    var block = eth.getBlock(i, true);

// 	    if (block != null && block.transactions != null) {
// 	      block.transactions.forEach( function(e) {
// 	        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
// 	          console.log("  tx hash          : " + e.hash + "\n"
// 	            + "   nonce           : " + e.nonce + "\n"
// 	            + "   blockHash       : " + e.blockHash + "\n"
// 	            + "   blockNumber     : " + e.blockNumber + "\n"
// 	            + "   transactionIndex: " + e.transactionIndex + "\n"
// 	            + "   from            : " + e.from + "\n" 
// 	            + "   to              : " + e.to + "\n"
// 	            + "   value           : " + e.value + "\n"
// 	            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
// 	            + "   gasPrice        : " + e.gasPrice + "\n"
// 	            + "   gas             : " + e.gas + "\n"
// 	            + "   input           : " + e.input);
// 	        }
// 	      })
// 	    }
// 	  }

// }


module.exports = address;