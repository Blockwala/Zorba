var Promise = require("bluebird");
var async = require('async');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
const request = require('request');



/********
Aim:  Connect to Mongo and begin if connected

url : url of mongo DB
*******/

MongoClient.connect('mongodb://52.221.208.27:27017', function(err, db) {
  if (err) {
  	throw err;
  } else {
  	dbo = db.db("ethereum");
  	console.log(dbo)
  	start_parsing();
  }
});


start_parsing = function() {
	var collection = dbo.collection("transactions");

	collection //change collection here
	.count()
	.then(function(response) {
		console.log(response)
		var bucket_size = 500
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

			var cursor = dbo.collection("transfers")
			.find({})
			.limit(limit)
			.skip(skip)
			.sort({"blockNumber": -1});

			cursor.forEach(
				function(doc) {

					doc = to_lower_case(doc)

					console.log(doc.hash)

					collection
					.update({'hash': doc.hash}, doc, {upsert: true})

				},
				function(err) {
					console.log("End")
					callback_outer();
				})
		});


	})
	.catch(function(error) {
		console.log(error);
	})
	
}

to_lower_case = function(obj) {
	for (var k in obj){
	    if (typeof obj[k] == "object" && obj[k] !== null)
	        to_lower_case(obj[k]);
	    else if(typeof obj[k] == "string") {
			obj[k] = obj[k].toLowerCase();
		}
	}
	return obj;
}