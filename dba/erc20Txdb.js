var mongoDB = require('mongoose');
var Promise = require('bluebird');
var erc20TransactionSchema = require('../db_schema/erc20Tx.js');
var erc20Tx = mongoDB.model("erc20_tx", erc20TransactionSchema.erc20TransactionSchema);
erc20Tx = Promise.promisifyAll(erc20Tx);

var erc20TxOperations = {};

erc20TxOperations.findOne = function(_coinAddress, _userAddress) {
    return erc20Tx.find({$and : [

    	{address: _coinAddress}, 
    	{$or : [ {from:_userAddress}, {to:_userAddress} ]} 

    ]
    });
}

erc20TxOperations.create = function(data) {
	return erc20Tx.create(data);
}

erc20TxOperations.insertIfNotExists = function(data) {
	return erc20Tx.update({"$setOnInsert": {data}}, {upsert: true})
}

module.exports.erc20TxOperations = erc20TxOperations;