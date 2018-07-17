var address = {};

var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');

var contract_address;
var start_block;
var stop_block;
var latest_block_number;
var bucket_size = 50000;


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


web3_helper.getBlockNumber()
	.then(function(response) {
		latest_block_number = Number(response);
		console.log(">>>>2 "+response)
		if(latest_block_number == undefined) {
			null_block_number();
		}else {
			parse_blockchain_backwards();
		}
	})
	.catch(function(error) {
		console.log(">>>>3 "+error)
		null_block_number();
	})


null_block_number = function() {
	console.log("latest_block_number is undefined");
	process.exit()
}


parse_blockchain_backwards = function() {
	buckets = latest_block_number / bucket_size

	console.log(buckets)
	console.log(latest_block_number)
	console.log(bucket_size)

	stop_block = latest_block_number
	stop_blocks = []

	for (var i = buckets; i > 0; i--) {
		console.log("stop block "+stop_block)
		stop_blocks.push(stop_block)
		stop_block = stop_block - bucket_size
	}

	async.eachSeries(stop_blocks, function(stop_block_local, callback_outer) {
		start_block_local = stop_block_local - bucket_size;
		console.log("start block "+start_block_local);
		console.log("stop block "+stop_block_local);
		web3_helper.getAllTransferEvents(contract_address, start_block_local, stop_block_local)
			.then(function(events) {
				 console.log(">>>>FOR  "+stop_block_local);
				 console.log(">>>>LENGTH "+events.length);
				 callback_outer();
			})
			.catch(function(error) {
				console.log(">>>>3 "+error);
			})
  		}, function(err) {
		    if( err ) {
		      console.log(err);
		    } else {
			  //all Done
		    }
		});
}
