var sync = {}
var async = require('async')
var erc20_live_tokens = require('../migrations/erc20_live_tokens.json');
var _  = require('lodash')
const fs = require('fs'); // to work with filesystems
const config = require('config');
var folder = config.folder;
var erc20Generic = JSON.parse(fs.readFileSync(folder+"/abi/ERC20_generic.json"));
var erc20Txdb = require('../dba/erc20Txdb.js')
var ethTxdb = require('../dba/ethTxdb.js')

/*****

Called from web3-helper.js subscribe function

Get the block tx count

loop to make task array , each task pulls tx from parity

collect these tx and run their 'to' with live erc20 addresses


****/
sync.newBlockMined = function (blockHash, web3) {
	console.log("Beginning for " + blockHash);

	asyncTasks = []; //array of tasks to fetch tx
    txs = [] //array of to addresses from tx (we match later with supported coins)

    web3.eth.getBlock(blockHash, true)
    .then(function(blockObject) {
    	var txs = blockObject.transactions;
    	sync.ethTransfer(txs, web3, blockObject.timestamp);
    	sync.matchErc20LiveTokensWithLastMinedTxs(txs, web3, blockObject.timestamp);
    })
    .catch(function(Error) {
    	console.log(Error)
    })

}



sync.ethTransfer = function(lastMinedTxs, web3, timestamp) {

	var liveErc20TokenAddresses = _.map(erc20_live_tokens, 'address');
 
	_.forEach(liveErc20TokenAddresses, function(address) {
		address = address.toLowerCase();
	})

	//shortlist non erc20 tx from list of erc20 address we have
	var regularTxs = _.filter(lastMinedTxs, function(tx) {
		if (tx == null || tx == undefined || tx.to == undefined || tx.value == undefined || tx.value == 0) {
			return false;
		}
		return (_.indexOf(liveErc20TokenAddresses, tx.to.toString()) <= -1);
	});

	console.log('---------------------shortlisted txs');
	migrateEthToMongo(regularTxs, timestamp)

}

migrateEthToMongo = function(txs, timestamp) {
	_.forEach(txs, function(tx) {
		tx = to_lower_case(tx, timestamp);
		console.log(tx.hash)
		ethTxdb.UpdateOrInsert(tx)
		.then(function(res) {

		})
		.catch(function(error) {

		})
	})
}


/*****
Aim: Async match of txs to live erc20

Note: Regular txs called by web3.eth.getTransaction do not contain erc20 contract meta-data hence we have to requery them
after identifying

Steps:

pull txReceivers from the mined tx, its an array of addresses of ERC20 and non-erc20 

pull liveErc20TokenAddresses, the ones we support

intersect the two arrays from above and you have only addresses where tx occurred in last block: erc20AddressesForWhichTxOccurredInLastBlock

check if length = 0 then return

get all erc20_txs which occurred in last block. we loop over last mined tx and match with the addresses from above

get the hashes from erc20 tx from above

call getTransferEvents , as the name suggests it will call last block transfer events of the shortlisted erc20 address




******/
sync.matchErc20LiveTokensWithLastMinedTxs = function(lastMinedTxs, web3, timestamp) {

	var txRecievers = _.map(lastMinedTxs, 'to');
	var liveErc20TokenAddresses = _.map(erc20_live_tokens, 'address');

	txRecievers = txRecievers.map(function(address){
		if(address != null)
		return address.toLowerCase();
	})

	liveErc20TokenAddresses = liveErc20TokenAddresses.map(function(address) {
		if(address != null)
		return address.toLowerCase();
	})

	var blockNumber = undefined;

	if(lastMinedTxs.length > 0) {
		blockNumber = lastMinedTxs[0].blockNumber
	}

	var erc20AddressesForWhichTxOccurredInLastBlock = _.intersection(txRecievers, liveErc20TokenAddresses)

	if(erc20AddressesForWhichTxOccurredInLastBlock.length == 0) return;

	// console.log(erc20AddressesForWhichTxOccurredInLastBlock);

	erc20_txs = _.filter(lastMinedTxs, function(tx) {  
		if(tx == null || tx == undefined || tx.to == null) {
			return false;
		}
		return (_.indexOf(erc20AddressesForWhichTxOccurredInLastBlock, tx.to.toString()) > -1);
	 });

	txHashesOfLastMinedErc20Txs = _.map(erc20_txs, 'hash');

	sync.getTransferEvents(txHashesOfLastMinedErc20Txs, erc20AddressesForWhichTxOccurredInLastBlock, web3, blockNumber, timestamp); 
	
}

/**

call last block events of the shortlisted erc20 address

check if they are tranfer event

match the hash with given tx hashes

if match then store it

**/

sync.getTransferEvents = function(txHashesOfLastMinedErc20Txs, erc20AddressesForWhichTxOccurredInLastBlock, web3, blockNumber, timestamp) {

	var erc20ContractAbi = erc20Generic.abi;
	var options = {}
	options['fromBlock'] = Number(blockNumber)-1;
	options['toBlock'] = Number(blockNumber);


    // console.log(">>>>options "+JSON.stringify(options)); 

    var asyncTasks = [];
    var transferEvents = [];

    console.log(erc20AddressesForWhichTxOccurredInLastBlock)

    async.eachSeries(erc20AddressesForWhichTxOccurredInLastBlock, function(erc20Address, callback_outer) {
        	var task =	function(callback_inner) {
					 		new web3.eth
					 		.Contract(erc20ContractAbi, erc20Address)
						    .getPastEvents('Transfer', options, function(error, events) {
		                        if(error) {
		                            console.log("..error "+error);
		                        }
		                        transferEvents = _.concat(transferEvents, events);
		                        callback_inner();
			                });
				        }
            asyncTasks.push(task);
            callback_outer();
        }, function(err) {
			    if( err ) {
			      console.log(err);
			    } else {
				  //Run all tasks in parallel
				  async.parallel(asyncTasks, function(err, results) {
					    if( err ) {
					      console.log(err);
					      throw err;
					    } else {
					    	console.log("--------")
					    	console.log(transferEvents.length);
					    	sync.storeInMongo(transferEvents, timestamp)
					    }
					});
			    }
		});
}

sync.storeInMongo = function(transferEvents, timestamp) {
	_.forEach(transferEvents, function(event) {
		if(event == undefined) return;
		event = to_lower_case(event, timestamp)
		erc20Txdb.UpdateOrInsert(event)
		.then(function(res) {
			console.log(res)
		})
		.catch(function(error){
			console.log(error)
		})
	})
}

to_lower_case = function(obj, timestamp) {
	for (var k in obj) {
	    if (typeof obj[k] == "object" && obj[k] !== null)
	        to_lower_case(obj[k]);
	    else if(typeof obj[k] == "string") {
			obj[k] = obj[k].toLowerCase();
		}
	}
	if(timestamp != undefined) obj.timestamp = timestamp;
	return obj;
}

module.exports = sync;