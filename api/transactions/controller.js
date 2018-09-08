var transactions = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');
var blockCypherAPI = require('./api_token.json');
var request = require('request');


transactions.getState = function(req, res) {
	var address = req.query.address;
	web3_helper.getGasPrice()
		 .then(function(gasPrice) {
		 	web3_helper.getTransactionCount(address)
		 		.then((transactionCount) => {

		 			res.status(200).send({"gas_price": gasPrice, 
		 								  "gas_limit_eth": "21000", 
		 								  "gas_limit_erc20": "40000",
		 				 				  "transaction_count":transactionCount});

		 		})
		 		.catch((error) => {
		 			console.log(error)
	            	res.status(500).send({"error": error});
	        	});
	        })
	        .catch((error) => {
	        	console.log(error)
	            res.status(500).send({"error": error});
	        });
}

transactions.broadcastTxs = function(req, res) {
	txHash = req.body.tx;
	console.log(txHash)
	request.post(
    'https://api.blockcypher.com/v1/eth/main/txs/push?token='+blockCypherAPI.token,
    { json: { "tx": txHash } },
    function (error, response, body) {
    		res.status(response.statusCode).send(response.body);
   	 	}
	);

}

module.exports = transactions;