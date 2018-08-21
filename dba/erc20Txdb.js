var mongoDB = require('mongoose');
var Promise = require('bluebird');
var transfers = require('../db_schema/transfers.js');
var erc20Tx = mongoDB.model("transfers", transfers);
erc20Tx = Promise.promisifyAll(erc20Tx);

var erc20TxTransfers = {};

erc20TxTransfers.findOne = function(_coinAddress, _userAddress) {
    return erc20Tx.find({$and : [

    	{address: _coinAddress}, 
    	{$or : [ {from:_userAddress}, {to:_userAddress} ]} 

    ]
    });
}

erc20TxTransfers.create = function(data) {
	return erc20Tx.create(data);
}

erc20TxTransfers.insertIfNotExists = function(data) {
	return erc20Tx.update({"$setOnInsert": {data}}, {upsert: true})
}

erc20TxTransfers.UpdateOrInsert = function(event) {
	return erc20Tx.update({'transactionHash': event.transactionHash}, event, {upsert: true})
}

module.exports = erc20TxTransfers;