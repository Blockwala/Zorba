var Promise = require("bluebird");
var async = require('async');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
const request = require('request');

var dbo;

MongoClient.connect('mongodb://explorer.blockwala.io:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");
  	start();
  }
});


start = function() {

	var collection = dbo.collection("transfers");
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

		for(var i = 2; i < buckets; i++) {
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

			cursor.forEach(
				function(doc) {
					console.log(doc.timestamp);
					console.log(doc.number)
					collection.updateMany({"blockNumber": doc.number}, {"$set":{timestamp: doc.timestamp}},  { upsert: true })
					var waitTill = new Date(new Date().getTime() + .05 * 1000);
					while(waitTill > new Date()){}
				},
				function(err) { 

					console.log("End")
					callback_outer();

				})
		});

	})
	.catch(console.log("Error"));

}




