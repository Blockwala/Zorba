var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');

var contract_address;
var start_block;
var stop_block;
var bucket_size = 50000;


/*****
Parse the arguments frm command line
contract_address : needed argument
start_block: optional
stop_block: optional
****/
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


/**
Sync from last block to first block since no start and stop blocks
are given to the script
**/
sync_all_transfer_events = function() {
	web3_helper.getBlockNumber()
		.then(function(response) {

			console.log(">>>>2 " + response)
			latest_block_number = Number(response);
			
			if(latest_block_number == undefined) {
				error_script("last block is null");
			}else {
				parse_blockchain_backwards(latest_block_number);
			}
		})
		.catch(function(error) {
			error_script(error);
		})
}

/***

In case of syncing entire chain

**/
parse_blockchain_backwards = function(latest_block_number) {
	buckets = latest_block_number / bucket_size

	p(buckets)
	p(latest_block_number)
	p(bucket_size)

	stop_block = latest_block_number
	stop_blocks = []

	for (var i = buckets; i > 0; i--) {
		p("stop block " + stop_block)
		stop_blocks.push(stop_block)
		stop_block = stop_block - bucket_size
	}

	async.eachSeries(stop_blocks, function(stop_block_local, callback_outer) {
		start_block_local = stop_block_local - bucket_size + 1;
		p("start block " + start_block_local);
		p("stop block " + stop_block_local);
		get_transfer_events(contract_address, start_block_local, stop_block_local)
			.then(function(events) {
				p(">>>>FOR  " + stop_block_local);
				p("LENGTH " + events.length);
				callback_outer();
				})
			.catch(function(error) {
				p(">>>>3 " + error);
				callback_outer();
			})
  		}, function(err) {
		    if( err ) {
		      console.log(err);
		    } else {
			  //all Done
			  p("Done")
		    }
		});
}

get_transfer_events = function(address_local, 
							   start_block_local, 
							   stop_block_local) {

	return web3_helper.getAllTransferEvents(address_local, 
		start_block_local, stop_block_local)

}


error_script = function(error) {
	console.log(error);
	process.exit()
}

p = function(message) {
	console.log(message)
}


/*****
check what does the script initator want from the script

*****/
if(start_block != undefined) {
	if(stop_block != undefined) {

		if(stop_block - start_block > 200000) {
			error_script("block difference can't be more than 200000")
			process.exit()
		}

		get_transfer_events(contract_address, start_block, stop_block)
			.then(function(response) {
				p(">>>>FOR  " + stop_block_local);
				p("LENGTH " + events.length);
			})
			.catch(function(error) {
				p(">>>>Error " + error)
			}) 
	}else {
		error("start_block is defined but stop_block is not defined")
	}
}else {
	sync_all_transfer_events();
}
