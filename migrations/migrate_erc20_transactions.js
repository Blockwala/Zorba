var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
var erc20Txdb = require("../dba/erc20Txdb.js").erc20TxOperations
var MongoClient = require('mongodb').MongoClient;
const request = require('request');
var erc20_live_tokens = require('./erc20_live_tokens.json');

var bucket_size = 10000;


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

	var contract_address;
	var start_block;
	var stop_block;

	process.argv.forEach(function (val, index, array) {
	  console.log(index + ': ' + val);
	  switch(index) {
	  	case 2:
	  		contract_address = val;
	  	break;

	  	case 3:
	  		start_block = val;
	  	break;

	  	case 4:
	  		stop_block = val;
	  	break;
	  }
	});		
	decide_type_for_script(contract_address, start_block, stop_block);		
}


/********

Aim: check what does the script initator want from the script

********/

decide_type_for_script = function(contract_address, start_block, stop_block) {

	//All 3 params given
	if( contract_address!=undefined && start_block != undefined &&  stop_block != undefined) {
		if(stop_block - start_block > 200000) {
				error_script("block difference can't be more than 200000");
				process.exit();
			}
		sync_selected_transfer_events(contract_address, start_block, stop_block);
		return;
	}

	//Only 2 params given
	if( contract_address != undefined && start_block != undefined && stop_block == undefined) {
		error("start_block is defined but stop_block is not defined")
		return
	}

	//1 param given 
	if(contract_address != undefined && start_block == undefined &&  stop_block == undefined) {
		sync_all_transfer_events(contract_address);
		return;
	}

	//0 params given
	if(contract_address == undefined && start_block == undefined &&  stop_block == undefined) {
		sync_all_transfer_events_for_all_live_erc20_tokens();
		return;
	}

}


/**

Aim: Sync all live erc20 contracts from latest block to last block.

Note if Parity is running in fast mode then only ~50,000 blocks transfer events 

are available.

API : https://s3-ap-southeast-1.amazonaws.com/tokeninfo/tokens-info/info/erc20/ethTokensLive.json
**/

sync_all_transfer_events_for_all_live_erc20_tokens = function() {
	// url = "https://s3-ap-southeast-1.amazonaws.com/tokeninfo/tokens-info/info/erc20/ethTokensLive.json"
	// request(url, { json: true }, (err, res, body) => {

	// if (err) { return console.log(err); }

	// erc20Array = res.body

	//commented out the network call

	async.eachSeries(erc20_live_tokens, function(erc20Element, callback) {

		p("------------------------------")
		p("starting for")
		p(erc20Element.address)
		p(erc20Element.symbol)

		sync_all_transfer_events(erc20Element.address, erc20Element.symbol)
		.then(function(response) {
			p("!!!!!CALLBACK!!!!!!!")
			callback();
		})
		.catch(function(error) {
			p(error)
			exit()
		})	

	 })

	// });
}


/********

Aim: Sync only events in range of start and stop block

@params:

1. contract_address Contract address, whose transfer events have to be migrated
2. start_block
3. stop_block
********/

sync_selected_transfer_events = function(contractAddress, startBlock, stopBlock) {
	get_transfer_events(contractAddress, startBlock, stopBlock)
			.then(function(response) {
				p(">>>>FOR  " + stop_block_local);
				p("LENGTH " + events.length);
				//Todo write a function like sync_all_transfer_events but with 3 arguments
			})
			.catch(function(error) {
				p(">>>>Error " + error)
			}) 
}


/**

Sync from last block to first block since no start and stop blocks
are given to the script

**/
sync_all_transfer_events = function(contractAddress, symbol) {
	return web3_helper.getBlockNumber()
		.then(function(response) {

			console.log(">>>>2 " + response)
			latest_block_number = Number(response);
			
			if(latest_block_number == undefined) {
				error_script("last block is null");
			}else {
				return parse_blockchain_backwards(contractAddress, latest_block_number, symbol);
			}
		})
		.catch(function(error) {
			error_script(error);
		})
}

/***

In case of syncing entire chain

**/
parse_blockchain_backwards = function(contractAddress, latest_block_number, symbol) {

	return new Promise(function(resolve, reject) {
		// buckets = latest_block_number / bucket_size
		buckets = 1
		p(buckets)
		p(latest_block_number)
		p(bucket_size)

		stop_block = latest_block_number
		stop_blocks = []

		for (var i = buckets; i > 0; i--) {
			// p("stop block " + stop_block)
			stop_blocks.push(stop_block)
			stop_block = stop_block - bucket_size
		}

		p("------------------------------------BEGIN ASYNC EACH In SERIES----------------")

		async.eachSeries(stop_blocks, function(stop_block_local, callback_outer) {
			start_block_local = stop_block_local - bucket_size + 1;
			p("start block " + start_block_local);
			p("stop block " + stop_block_local);
			get_transfer_events(contractAddress, start_block_local, stop_block_local)
				.then(function(events) {
						p(">>>>FOR  " + stop_block_local);
						p("LENGTH " + events.length);
						scan_and_migrate(events, symbol)
						callback_outer();
					})
				.catch(function(error) {
					p(">>>>3 " + error);
					callback_outer();
				})
	  		}, function(err) {
			    if( err ) {
			      console.log(err);
			      reject(err);
			    } else {
				  //all Done
				  p("Done")
				  resolve("done");
			    }
			});
	});
}


/***

Get trafer events call to web3 helper

@Params

address_local : Address of contract
start_block_local: start
stop_block_local: stop

***/
get_transfer_events = function(addressLocal, 
							   startBlockLocal, 
							   stopBlockLocal) {

	return web3_helper.getAllTransferEvents(addressLocal, startBlockLocal, stopBlockLocal)

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


