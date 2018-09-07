var transactions = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');
var blockCypherAPI = require('./api_token.json');
var request = require('request');


transactions.getState = function(req, res) {
	web3_helper.getGasPrice()
		 .then((gasprice) => {
	            res.status(200).send({"gas_price": gasprice, "gas_limit": "21000"});
	        })
	        .catch((error) => {
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