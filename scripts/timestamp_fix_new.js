var Promise = require("bluebird");
var async = require('async');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
const request = require('request');

var dbo;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");
  	start();
  }
});


start = function() {

	var collection = dbo.collection("transferss");
	var blockCollection = dbo.collection("blocks");

	blockCollection //change collection here
	.count()
	.then(function(response) {
		console.log(response)
		var bucket_size = 1000
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
			blockCollection
			.find({})
			.limit(limit)
			.skip(skip)
			.sort({"number": 1}); //make sure this is indexed

			var q = async.queue(function (doc, callback) {
					  	// code for your update
					  	console.log(doc.timestamp);
						console.log(doc.number)
						collection.updateMany({"blockNumber": doc.number}, {"$set":{timestamp: doc.timestamp}},  { upsert: true }, callback)
					}, Infinity);

			cursor.forEach(
				function(doc) {
  					if (doc) q.push(doc); // dispatching doc to async.queue
				},
				function(err) {

					q.drain = function() {
						  if (cursor.isClosed()) {
						    callback_outer();
						    console.log("End")
						  }
						}
				})
		});

	})
	.catch(console.log("Error"));

}




