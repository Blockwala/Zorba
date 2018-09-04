var Promise = require("bluebird");
var web3_helper = require('./web3_migrations.js');
var async = require('async');
var _ = require('lodash');
var erc20_live_tokens = require('./erc20_live_tokens.json');
var MongoClient = require('mongodb').MongoClient;
const request = require('request');



MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");
  	p(dbo)
  	start_parsing();
  }
});


var collection = dbo.collection("transactions");
var blockCollection = dbo.collection("blocks");

	collection //change collection here
	.count()
	.then(function(response) {
		console.log(response)
		var bucket_size = 10000
		var buckets = Number(response)/bucket_size
		var index = []
		console.log(buckets)
		console.log(bucket_size)

		for(var i = 0; i < buckets; i++) {
			index.push(i)
		}

		async.eachSeries(index, function (i, callback_outer) {
			var limit = bucket_size;
			var skip = i * bucket_size;
			console.log('.....')
			console.log(limit)
			console.log(skip)

			var cursor = 
			collection
			.find({})
			.limit(limit)
			.skip(skip)
			.sort({"blockNumber": 1}); //make sure this is indexed

			cursor.forEach(
				function(doc) {

					block =  blockCollection.find({"number": blockNumber}, {"timestamp":1})

					doc.timestamp = block.timestamp

					console.log(doc.timestamp) //change var if collection change

					collection
					.update({'hash': doc.hash}, doc, {upsert: true}) //change var if collection change
					
				},
				function(err) { 

					console.log("End")
					callback_outer();

				})
		});

	})
	.catch(console.log("Error"));




