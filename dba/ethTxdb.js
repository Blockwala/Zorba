var mongoDB = require('mongoose');
var Promise = require('bluebird');
var transactions = require('../db_schema/transactions.js');
var ethTx = mongoDB.model("transactions", transactions);
ethTx = Promise.promisifyAll(ethTx);

var ethTxTransfers = {};

ethTxTransfers.findOne = function(_userAddress, _requiredFields) {
    
	query = {
        $or : 
        [ 
          {'returnValues.from':_userAddress}, 
          {'returnValues.to':_userAddress} 
        ]
    }; 

    console.log(JSON.stringify(query));
    return ethTx.find(query).select(_requiredFields);
}


ethTxTransfers.create = function(data) {
	return ethTx.create(data);
}

ethTxTransfers.insertIfNotExists = function(data) {
	return ethTx.update({"$setOnInsert": {data}}, {upsert: true})
}

ethTxTransfers.UpdateOrInsert = function(event) {
	return ethTx.update({'transactionHash': event.transactionHash}, event, {upsert: true})
}

module.exports = ethTxTransfers;